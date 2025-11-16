// WebSocket Service for Real-time Communication
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { store } from '../store';
import { updateLiveLocations, setGeofenceEvent } from '../store/slices/locationSlice';

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

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'GUARD' | 'ADMIN' | 'CLIENT';
  recipientId?: string;
  roomId: string;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'location' | 'emergency';
  timestamp: number;
  readBy: string[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  location?: LocationUpdate;
}

interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  isTyping: boolean;
  timestamp: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private userId: string | null = null;
  private userRole: string | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Initialize WebSocket connection
   */
  async connect(): Promise<void> {
    try {
      // Get user data from storage
      const userData = await AsyncStorage.getItem('userData');
      const tokenData = await AsyncStorage.getItem('tokenData');

      if (!userData || !tokenData) {
        logger.warn('No user data or token found for WebSocket connection');
        return;
      }

      const user = JSON.parse(userData);
      const token = JSON.parse(tokenData);

      this.userId = user.id;
      this.userRole = user.role;

      // Determine server URL
      const baseURL = __DEV__
        ? (require('react-native').Platform.OS === 'android'
            ? 'http://10.0.2.2:3000'
            : 'http://localhost:3000')
        : 'https://your-production-api.com';

      // Create socket connection
      this.socket = io(baseURL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        auth: {
          token: token.accessToken,
        },
      });

      this.setupSocketEventHandlers();
      
      logger.info('WebSocket connection initiated');
    } catch (error) {
      logger.error('Failed to initialize WebSocket connection:', error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      logger.info('WebSocket disconnected');
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('WebSocket connected');

      // Authenticate with server
      this.authenticate();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      logger.warn(`WebSocket disconnected: ${reason}`);

      // Attempt to reconnect if not a manual disconnect
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error);
      this.attemptReconnect();
    });

    this.socket.on('authenticated', (data) => {
      if (data.success) {
        logger.info('WebSocket authenticated successfully');
        
        // Request initial live data for admins/clients
        if (this.userRole === 'ADMIN' || this.userRole === 'CLIENT') {
          this.requestLiveLocations();
        }
      } else {
        logger.error('WebSocket authentication failed');
      }
    });

    this.socket.on('authentication_error', (data) => {
      logger.error('WebSocket authentication error:', data.message);
    });
  }

  /**
   * Setup application event handlers
   */
  private setupEventHandlers(): void {
    // Listen for location updates from guards
    this.onGuardLocationUpdate = this.onGuardLocationUpdate.bind(this);
    this.onGeofenceEvent = this.onGeofenceEvent.bind(this);
    this.onEmergencyAlert = this.onEmergencyAlert.bind(this);
    this.onLiveLocationsUpdate = this.onLiveLocationsUpdate.bind(this);
  }

  /**
   * Authenticate with server
   */
  private async authenticate(): Promise<void> {
    if (!this.socket || !this.userId || !this.userRole) return;

    try {
      const tokenData = await AsyncStorage.getItem('tokenData');
      if (!tokenData) return;

      const token = JSON.parse(tokenData);

      this.socket.emit('authenticate', {
        token: token.accessToken,
        userId: this.userId,
        role: this.userRole,
      });
    } catch (error) {
      logger.error('Failed to authenticate WebSocket:', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  /**
   * Send location update (for guards)
   */
  sendLocationUpdate(locationData: LocationUpdate): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot send location update: WebSocket not connected');
      return;
    }

    this.socket.emit('location_update', locationData);
    logger.debug('Location update sent:', locationData);
  }

  /**
   * Send geofence event
   */
  sendGeofenceEvent(eventData: GeofenceEvent): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot send geofence event: WebSocket not connected');
      return;
    }

    this.socket.emit('geofence_event', eventData);
    logger.info(`Geofence ${eventData.eventType} event sent for guard ${eventData.guardId}`);
  }

  /**
   * Send emergency alert
   */
  sendEmergencyAlert(data: { guardId: string; location: LocationUpdate; message?: string }): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot send emergency alert: WebSocket not connected');
      return;
    }

    this.socket.emit('emergency_alert', data);
    logger.warn(`Emergency alert sent for guard ${data.guardId}`);
  }

  /**
   * Send shift status update
   */
  sendShiftStatusUpdate(data: { guardId: string; shiftId: string; status: string; location?: LocationUpdate }): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot send shift status update: WebSocket not connected');
      return;
    }

    this.socket.emit('shift_status_update', data);
    logger.info(`Shift status update sent: ${data.status}`);
  }

  /**
   * Send chat message
   */
  sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy'>): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot send message: WebSocket not connected');
      return;
    }

    const messageData: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      readBy: [],
    };

    this.socket.emit('chat_message', messageData);
    logger.info(`Message sent to room ${message.roomId}`);
  }

  /**
   * Join chat room
   */
  joinRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot join room: WebSocket not connected');
      return;
    }

    this.socket.emit('join_room', { roomId, userId: this.userId });
    logger.info(`Joined room: ${roomId}`);
  }

  /**
   * Leave chat room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot leave room: WebSocket not connected');
      return;
    }

    this.socket.emit('leave_room', { roomId, userId: this.userId });
    logger.info(`Left room: ${roomId}`);
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(roomId: string, isTyping: boolean): void {
    if (!this.socket || !this.isConnected || !this.userId) return;

    const typingData: TypingIndicator = {
      userId: this.userId,
      userName: 'Current User', // This would come from user data
      roomId,
      isTyping,
      timestamp: Date.now(),
    };

    this.socket.emit('typing_indicator', typingData);
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string, roomId: string): void {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('message_read', {
      messageId,
      roomId,
      userId: this.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Send file/image message
   */
  sendFileMessage(roomId: string, fileUrl: string, fileName: string, fileSize: number, messageType: 'image' | 'file'): void {
    if (!this.socket || !this.isConnected || !this.userId) return;

    this.sendMessage({
      senderId: this.userId,
      senderName: 'Current User',
      senderRole: this.userRole as any,
      roomId,
      message: fileName,
      messageType,
      fileUrl,
      fileName,
      fileSize,
    });
  }

  /**
   * Request live locations (for admins/clients)
   */
  requestLiveLocations(): void {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot request live locations: WebSocket not connected');
      return;
    }

    this.socket.emit('request_live_locations');
    logger.debug('Live locations requested');
  }

  /**
   * Event handlers
   */
  private onGuardLocationUpdate(data: any): void {
    logger.debug('Received guard location update:', data);
    // Handle real-time location updates in UI
    // Could update maps, notifications, etc.
  }

  private onGeofenceEvent(data: GeofenceEvent): void {
    logger.info(`Received geofence ${data.eventType} event for guard ${data.guardId}`);
    
    // Update Redux store
    store.dispatch(setGeofenceEvent({
      guardId: data.guardId,
      geofenceId: data.geofenceId,
      eventType: data.eventType,
      timestamp: data.timestamp,
    }));

    // Could trigger notifications or alerts
  }

  private onEmergencyAlert(data: any): void {
    logger.warn('EMERGENCY ALERT received:', data);
    
    // Handle emergency alerts - show notifications, alerts, etc.
    // This would typically trigger immediate UI responses
  }

  private onLiveLocationsUpdate(data: any[]): void {
    logger.debug('Received live locations update');
    
    // Update Redux store with live locations
    store.dispatch(updateLiveLocations(data));
  }

  /**
   * Register event listeners
   */
  registerEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('guard_location_update', this.onGuardLocationUpdate);
    this.socket.on('geofence_event', this.onGeofenceEvent);
    this.socket.on('emergency_alert', this.onEmergencyAlert);
    this.socket.on('live_locations_update', this.onLiveLocationsUpdate);
    this.socket.on('live_locations_data', this.onLiveLocationsUpdate);
    this.socket.on('shift_status_changed', (data) => {
      logger.info('Shift status changed:', data);
    });
    this.socket.on('emergency_broadcast', (data) => {
      logger.warn('Emergency broadcast received:', data);
    });
    this.socket.on('notification', (data) => {
      logger.info('Notification received:', data);
    });
    
    // Messaging event listeners
    this.socket.on('chat_message', this.onChatMessage.bind(this));
    this.socket.on('typing_indicator', this.onTypingIndicator.bind(this));
    this.socket.on('message_read', this.onMessageRead.bind(this));
    this.socket.on('user_joined_room', this.onUserJoinedRoom.bind(this));
    this.socket.on('user_left_room', this.onUserLeftRoom.bind(this));
  }

  /**
   * Chat message event handler
   */
  private onChatMessage(message: ChatMessage): void {
    logger.info('Chat message received:', message);
    // Dispatch to Redux store or trigger callback
    store.dispatch({ type: 'chat/messageReceived', payload: message });
  }

  /**
   * Typing indicator event handler
   */
  private onTypingIndicator(data: TypingIndicator): void {
    logger.debug('Typing indicator:', data);
    store.dispatch({ type: 'chat/typingIndicator', payload: data });
  }

  /**
   * Message read event handler
   */
  private onMessageRead(data: { messageId: string; userId: string; timestamp: number }): void {
    logger.debug('Message read:', data);
    store.dispatch({ type: 'chat/messageRead', payload: data });
  }

  /**
   * User joined room event handler
   */
  private onUserJoinedRoom(data: { userId: string; userName: string; roomId: string }): void {
    logger.info('User joined room:', data);
    store.dispatch({ type: 'chat/userJoined', payload: data });
  }

  /**
   * User left room event handler
   */
  private onUserLeftRoom(data: { userId: string; userName: string; roomId: string }): void {
    logger.info('User left room:', data);
    store.dispatch({ type: 'chat/userLeft', payload: data });
  }

  /**
   * Unregister event listeners
   */
  unregisterEventListeners(): void {
    if (!this.socket) return;

    this.socket.off('guard_location_update', this.onGuardLocationUpdate);
    this.socket.off('geofence_event', this.onGeofenceEvent);
    this.socket.off('emergency_alert', this.onEmergencyAlert);
    this.socket.off('live_locations_update', this.onLiveLocationsUpdate);
    this.socket.off('live_locations_data', this.onLiveLocationsUpdate);
    this.socket.off('shift_status_changed');
    this.socket.off('emergency_broadcast');
    this.socket.off('notification');
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; reconnectAttempts: number } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Check if connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Send custom event
   */
  sendCustomEvent(event: string, data: any): void {
    if (!this.socket || !this.isConnected) {
      logger.warn(`Cannot send custom event ${event}: WebSocket not connected`);
      return;
    }

    this.socket.emit(event, data);
    logger.debug(`Custom event sent: ${event}`);
  }

  /**
   * Listen for custom event
   */
  onCustomEvent(event: string, callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.on(event, callback);
  }

  /**
   * Stop listening for custom event
   */
  offCustomEvent(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

export default new WebSocketService();
