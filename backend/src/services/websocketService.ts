// WebSocket Service for Real-time Location Broadcasting
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger.js';
import trackingService from './trackingService.js';

interface LocationUpdate {
  guardId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  batteryLevel?: number;
}

interface GeofenceEvent {
  guardId: string;
  geofenceId: string;
  eventType: 'ENTER' | 'EXIT';
  location: LocationUpdate;
  timestamp: number;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, string> = new Map(); // socketId -> userId
  private guardSockets: Map<string, string> = new Map(); // guardId -> socketId
  private adminSockets: Set<string> = new Set(); // socketIds of admin users

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.debug(`Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (data: { token: string; userId: string; role: string }) => {
        try {
          // TODO: Verify JWT token here
          // For now, we'll trust the client data
          
          this.connectedClients.set(socket.id, data.userId);
          
          if (data.role === 'GUARD') {
            // Find guard record by userId
            // This would need to be implemented with proper guard lookup
            this.guardSockets.set(data.userId, socket.id);
            socket.join('guards');
            logger.info(`Guard ${data.userId} connected`);
          } else if (data.role === 'ADMIN' || data.role === 'CLIENT') {
            this.adminSockets.add(socket.id);
            socket.join('admins');
            logger.info(`Admin/Client ${data.userId} connected`);
          }

          socket.emit('authenticated', { success: true });
        } catch (error) {
          logger.error('Authentication failed:', error);
          socket.emit('authentication_error', { message: 'Authentication failed' });
        }
      });

      // Handle location updates from guards
      socket.on('location_update', async (data: LocationUpdate) => {
        try {
          await this.handleLocationUpdate(socket.id, data);
        } catch (error) {
          logger.error('Failed to handle location update:', error);
        }
      });

      // Handle geofence events
      socket.on('geofence_event', async (data: GeofenceEvent) => {
        try {
          await this.handleGeofenceEvent(socket.id, data);
        } catch (error) {
          logger.error('Failed to handle geofence event:', error);
        }
      });

      // Handle emergency alerts
      socket.on('emergency_alert', async (data: { guardId: string; location: LocationUpdate; message?: string }) => {
        try {
          await this.handleEmergencyAlert(socket.id, data);
        } catch (error) {
          logger.error('Failed to handle emergency alert:', error);
        }
      });

      // Handle shift status updates
      socket.on('shift_status_update', (data: { guardId: string; shiftId: string; status: string; location?: LocationUpdate }) => {
        try {
          this.broadcastToAdmins('shift_status_changed', data);
          logger.info(`Shift status update: Guard ${data.guardId}, Shift ${data.shiftId}, Status: ${data.status}`);
        } catch (error) {
          logger.error('Failed to handle shift status update:', error);
        }
      });

      // Handle client requests for live data
      socket.on('request_live_locations', async () => {
        try {
          const liveData = await trackingService.getRealTimeLocationData();
          socket.emit('live_locations_data', liveData);
        } catch (error) {
          logger.error('Failed to get live locations:', error);
          socket.emit('error', { message: 'Failed to get live locations' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket.id);
      });
    });
  }

  private async handleLocationUpdate(socketId: string, data: LocationUpdate): Promise<void> {
    try {
      // Record location in database
      await trackingService.recordLocation(data.guardId, {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        batteryLevel: data.batteryLevel,
        timestamp: data.timestamp,
      });

      // Broadcast to all admins and clients
      this.broadcastToAdmins('guard_location_update', {
        guardId: data.guardId,
        location: data,
        timestamp: Date.now(),
      });

      logger.debug(`Location update broadcasted for guard: ${data.guardId}`);
    } catch (error) {
      logger.error('Failed to handle location update:', error);
      throw error;
    }
  }

  private async handleGeofenceEvent(socketId: string, data: GeofenceEvent): Promise<void> {
    try {
      // Record geofence event in database
      await trackingService.recordGeofenceEvent(data);

      // Broadcast to all admins
      this.broadcastToAdmins('geofence_event', {
        guardId: data.guardId,
        geofenceId: data.geofenceId,
        eventType: data.eventType,
        location: data.location,
        timestamp: data.timestamp,
      });

      logger.info(`Geofence ${data.eventType} event broadcasted for guard: ${data.guardId}`);
    } catch (error) {
      logger.error('Failed to handle geofence event:', error);
      throw error;
    }
  }

  private async handleEmergencyAlert(socketId: string, data: { guardId: string; location: LocationUpdate; message?: string }): Promise<void> {
    try {
      const emergencyData = {
        guardId: data.guardId,
        location: data.location,
        message: data.message || 'Emergency alert triggered',
        timestamp: Date.now(),
        alertId: `emergency_${Date.now()}_${data.guardId}`,
      };

      // Broadcast emergency alert to all admins with high priority
      this.broadcastToAdmins('emergency_alert', emergencyData);

      // Also send to all connected guards for awareness
      this.broadcastToGuards('emergency_broadcast', {
        message: `Emergency alert from guard ${data.guardId}`,
        location: data.location,
        timestamp: emergencyData.timestamp,
      });

      logger.warn(`EMERGENCY ALERT from guard ${data.guardId} at ${data.location.latitude}, ${data.location.longitude}`);
    } catch (error) {
      logger.error('Failed to handle emergency alert:', error);
      throw error;
    }
  }

  private handleDisconnection(socketId: string): void {
    const userId = this.connectedClients.get(socketId);
    
    if (userId) {
      // Remove from guard sockets if it was a guard
      for (const [guardId, guardSocketId] of this.guardSockets.entries()) {
        if (guardSocketId === socketId) {
          this.guardSockets.delete(guardId);
          logger.info(`Guard ${guardId} disconnected`);
          break;
        }
      }

      // Remove from admin sockets if it was an admin
      if (this.adminSockets.has(socketId)) {
        this.adminSockets.delete(socketId);
        logger.info(`Admin/Client ${userId} disconnected`);
      }

      this.connectedClients.delete(socketId);
    }

    logger.debug(`Client disconnected: ${socketId}`);
  }

  // Public methods for broadcasting
  broadcastToAdmins(event: string, data: any): void {
    if (!this.io) return;

    this.io.to('admins').emit(event, data);
    logger.debug(`Broadcasted ${event} to admins`);
  }

  broadcastToGuards(event: string, data: any): void {
    if (!this.io) return;

    this.io.to('guards').emit(event, data);
    logger.debug(`Broadcasted ${event} to guards`);
  }

  sendToSpecificGuard(guardId: string, event: string, data: any): void {
    if (!this.io) return;

    const socketId = this.guardSockets.get(guardId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      logger.debug(`Sent ${event} to guard ${guardId}`);
    }
  }

  sendToSpecificSocket(socketId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(socketId).emit(event, data);
    logger.debug(`Sent ${event} to socket ${socketId}`);
  }

  // Broadcast live location updates periodically
  startLiveLocationBroadcast(): void {
    setInterval(async () => {
      try {
        const liveData = await trackingService.getRealTimeLocationData();
        this.broadcastToAdmins('live_locations_update', liveData);
      } catch (error) {
        logger.error('Failed to broadcast live locations:', error);
      }
    }, 30000); // Broadcast every 30 seconds

    logger.info('Live location broadcast started');
  }

  // Get connection statistics
  getConnectionStats(): { totalConnections: number; guards: number; admins: number } {
    return {
      totalConnections: this.connectedClients.size,
      guards: this.guardSockets.size,
      admins: this.adminSockets.size,
    };
  }

  // Check if guard is online
  isGuardOnline(guardId: string): boolean {
    return this.guardSockets.has(guardId);
  }

  // Send notification to specific user
  sendNotification(userId: string, notification: { title: string; message: string; type: string; data?: any }): void {
    if (!this.io) return;

    // Find socket by userId
    for (const [socketId, connectedUserId] of this.connectedClients.entries()) {
      if (connectedUserId === userId) {
        this.io.to(socketId).emit('notification', notification);
        logger.debug(`Sent notification to user ${userId}`);
        break;
      }
    }
  }
}

export default new WebSocketService();
