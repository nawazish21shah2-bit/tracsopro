// WebSocket Service for Real-time Communication
import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import { addMessage } from '../store/slices/messageSlice';
import { addTrackingData } from '../store/slices/locationSlice';
import { updateIncidentStatus } from '../store/slices/incidentSlice';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  connect(userId: string, token: string) {
    if (this.socket?.connected) {
      return;
    }

    const { getWebSocketUrl } = require('../config/apiConfig');
    const baseURL = getWebSocketUrl();

    this.socket = io(baseURL, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket'],
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Real-time notifications
    this.socket.on('notification', (notification) => {
      store.dispatch(addNotification(notification));
    });

    // Real-time messages
    this.socket.on('message', (message) => {
      store.dispatch(addMessage(message));
    });

    // Location tracking updates
    this.socket.on('location_update', (trackingData) => {
      store.dispatch(addTrackingData(trackingData));
    });

    // Incident updates
    this.socket.on('incident_update', (incident) => {
      store.dispatch(updateIncidentStatus({
        incidentId: incident.id,
        status: incident.status,
      }));
    });

    // Emergency alerts
    this.socket.on('emergency_alert', (alert) => {
      this.handleEmergencyAlert(alert);
    });

    // System announcements
    this.socket.on('system_announcement', (announcement) => {
      this.handleSystemAnnouncement(announcement);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleEmergencyAlert(alert: any) {
    // Show emergency alert to user
    console.log('Emergency Alert:', alert);
    
    // In a real app, you might show a modal or push notification
    // For now, we'll just log it
  }

  private handleSystemAnnouncement(announcement: any) {
    // Handle system-wide announcements
    console.log('System Announcement:', announcement);
  }

  // Send methods
  sendMessage(recipientId: string, content: string, type: string = 'text') {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        recipientId,
        content,
        type,
        timestamp: new Date().toISOString(),
      });
    }
  }

  sendLocationUpdate(guardId: string, coordinates: any, accuracy: number, batteryLevel: number) {
    if (this.socket?.connected) {
      this.socket.emit('location_update', {
        guardId,
        coordinates,
        accuracy,
        batteryLevel,
        timestamp: new Date().toISOString(),
      });
    }
  }

  sendIncidentUpdate(incidentId: string, status: string, notes?: string) {
    if (this.socket?.connected) {
      this.socket.emit('incident_update', {
        incidentId,
        status,
        notes,
        timestamp: new Date().toISOString(),
      });
    }
  }

  sendEmergencyAlert(alert: any) {
    if (this.socket?.connected) {
      this.socket.emit('emergency_alert', {
        ...alert,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Join/Leave rooms
  joinRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', roomId);
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new WebSocketService();
