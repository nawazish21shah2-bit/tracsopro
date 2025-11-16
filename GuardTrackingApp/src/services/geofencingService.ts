/**
 * Advanced Geofencing Service
 * Automatic check-in/out with intelligent zone management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandler } from '../utils/errorHandler';
import { cacheService } from './cacheService';
import notificationService from './notificationService';
import locationTrackingService, { LocationData, GeofenceZone } from './locationTrackingService';

interface GeofenceEvent {
  id: string;
  geofenceId: string;
  eventType: 'enter' | 'exit' | 'dwell';
  location: LocationData;
  timestamp: number;
  shiftId?: string;
  duration?: number; // for dwell events
}

interface AutoCheckInConfig {
  enabled: boolean;
  requireConfirmation: boolean;
  dwellTimeThreshold: number; // seconds
  accuracyThreshold: number; // meters
  cooldownPeriod: number; // seconds between auto actions
}

interface GeofenceRule {
  id: string;
  geofenceId: string;
  action: 'auto_checkin' | 'auto_checkout' | 'patrol_point' | 'alert_only';
  conditions: {
    minDwellTime?: number;
    maxAccuracy?: number;
    timeOfDay?: { start: string; end: string };
    daysOfWeek?: number[]; // 0-6, Sunday = 0
  };
  isActive: boolean;
}

class GeofencingService {
  private isActive: boolean = false;
  private geofenceEvents: GeofenceEvent[] = [];
  private activeGeofences: Map<string, { entryTime: number; dwellTimer?: NodeJS.Timeout }> = new Map();
  private config: AutoCheckInConfig;
  private rules: GeofenceRule[] = [];
  private lastAutoAction: number = 0;

  constructor() {
    this.config = {
      enabled: true,
      requireConfirmation: true,
      dwellTimeThreshold: 30, // 30 seconds
      accuracyThreshold: 20, // 20 meters
      cooldownPeriod: 300, // 5 minutes
    };
  }

  /**
   * Initialize geofencing service
   */
  async initialize(): Promise<boolean> {
    try {
      await this.loadConfig();
      await this.loadRules();
      await this.loadGeofenceEvents();

      // Initialize location tracking if not already active
      const locationInitialized = await locationTrackingService.initialize();
      if (!locationInitialized) {
        throw new Error('Location tracking required for geofencing');
      }

      console.log('🗺️ Geofencing service initialized');
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'geofencing_init');
      return false;
    }
  }

  /**
   * Start geofencing monitoring
   */
  async startGeofencing(shiftId?: string): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        console.log('🗺️ Geofencing is disabled');
        return false;
      }

      this.isActive = true;
      
      // Start location tracking if not already active
      if (!locationTrackingService.isCurrentlyTracking()) {
        await locationTrackingService.startTracking(shiftId);
      }

      console.log('🗺️ Geofencing monitoring started');
      
      await notificationService.sendImmediateNotification(
        'Geofencing Active',
        'Automatic check-in/out monitoring is now active',
        { type: 'geofencing_started', shiftId }
      );

      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'start_geofencing');
      return false;
    }
  }

  /**
   * Stop geofencing monitoring
   */
  async stopGeofencing(): Promise<void> {
    try {
      this.isActive = false;
      
      // Clear all dwell timers
      this.activeGeofences.forEach(({ dwellTimer }) => {
        if (dwellTimer) clearTimeout(dwellTimer);
      });
      this.activeGeofences.clear();

      // Save events before stopping
      await this.saveGeofenceEvents();

      console.log('🗺️ Geofencing monitoring stopped');
      
      await notificationService.sendImmediateNotification(
        'Geofencing Stopped',
        'Automatic monitoring has been disabled',
        { type: 'geofencing_stopped' }
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'stop_geofencing');
    }
  }

  /**
   * Process geofence entry
   */
  async onGeofenceEnter(geofence: GeofenceZone, location: LocationData, shiftId?: string): Promise<void> {
    try {
      if (!this.isActive) return;

      const eventId = `${geofence.id}_enter_${Date.now()}`;
      const event: GeofenceEvent = {
        id: eventId,
        geofenceId: geofence.id,
        eventType: 'enter',
        location,
        timestamp: Date.now(),
        shiftId,
      };

      this.geofenceEvents.push(event);
      this.activeGeofences.set(geofence.id, { entryTime: Date.now() });

      // Process rules for this geofence
      await this.processGeofenceRules(geofence, event);

      // Set up dwell timer if needed
      this.setupDwellTimer(geofence, location, shiftId);

      console.log(`🗺️ Entered geofence: ${geofence.name}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'geofence_enter', false);
    }
  }

  /**
   * Process geofence exit
   */
  async onGeofenceExit(geofence: GeofenceZone, location: LocationData, shiftId?: string): Promise<void> {
    try {
      if (!this.isActive) return;

      const activeGeofence = this.activeGeofences.get(geofence.id);
      if (!activeGeofence) return;

      // Clear dwell timer
      if (activeGeofence.dwellTimer) {
        clearTimeout(activeGeofence.dwellTimer);
      }

      const duration = Date.now() - activeGeofence.entryTime;
      const eventId = `${geofence.id}_exit_${Date.now()}`;
      const event: GeofenceEvent = {
        id: eventId,
        geofenceId: geofence.id,
        eventType: 'exit',
        location,
        timestamp: Date.now(),
        shiftId,
        duration,
      };

      this.geofenceEvents.push(event);
      this.activeGeofences.delete(geofence.id);

      // Process exit rules
      await this.processGeofenceRules(geofence, event);

      console.log(`🗺️ Exited geofence: ${geofence.name} (duration: ${Math.round(duration / 1000)}s)`);
    } catch (error) {
      ErrorHandler.handleError(error, 'geofence_exit', false);
    }
  }

  /**
   * Setup dwell timer for geofence
   */
  private setupDwellTimer(geofence: GeofenceZone, location: LocationData, shiftId?: string): void {
    const dwellTimer = setTimeout(async () => {
      try {
        const eventId = `${geofence.id}_dwell_${Date.now()}`;
        const event: GeofenceEvent = {
          id: eventId,
          geofenceId: geofence.id,
          eventType: 'dwell',
          location,
          timestamp: Date.now(),
          shiftId,
          duration: this.config.dwellTimeThreshold * 1000,
        };

        this.geofenceEvents.push(event);
        await this.processGeofenceRules(geofence, event);

        console.log(`🗺️ Dwell event: ${geofence.name} (${this.config.dwellTimeThreshold}s)`);
      } catch (error) {
        ErrorHandler.handleError(error, 'geofence_dwell', false);
      }
    }, this.config.dwellTimeThreshold * 1000);

    // Update active geofence with timer
    const activeGeofence = this.activeGeofences.get(geofence.id);
    if (activeGeofence) {
      activeGeofence.dwellTimer = dwellTimer;
    }
  }

  /**
   * Process geofence rules
   */
  private async processGeofenceRules(geofence: GeofenceZone, event: GeofenceEvent): Promise<void> {
    try {
      const applicableRules = this.rules.filter(rule => 
        rule.geofenceId === geofence.id && 
        rule.isActive &&
        this.checkRuleConditions(rule, event)
      );

      for (const rule of applicableRules) {
        await this.executeRule(rule, geofence, event);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'process_geofence_rules', false);
    }
  }

  /**
   * Check if rule conditions are met
   */
  private checkRuleConditions(rule: GeofenceRule, event: GeofenceEvent): boolean {
    const { conditions } = rule;
    const now = new Date();

    // Check minimum dwell time
    if (conditions.minDwellTime && event.eventType !== 'dwell') {
      return false;
    }

    // Check accuracy threshold
    if (conditions.maxAccuracy && event.location.accuracy > conditions.maxAccuracy) {
      return false;
    }

    // Check time of day
    if (conditions.timeOfDay) {
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const startTime = parseInt(conditions.timeOfDay.start.replace(':', ''));
      const endTime = parseInt(conditions.timeOfDay.end.replace(':', ''));
      
      if (currentTime < startTime || currentTime > endTime) {
        return false;
      }
    }

    // Check days of week
    if (conditions.daysOfWeek && !conditions.daysOfWeek.includes(now.getDay())) {
      return false;
    }

    return true;
  }

  /**
   * Execute geofence rule
   */
  private async executeRule(rule: GeofenceRule, geofence: GeofenceZone, event: GeofenceEvent): Promise<void> {
    try {
      // Check cooldown period
      if (Date.now() - this.lastAutoAction < this.config.cooldownPeriod * 1000) {
        console.log('🗺️ Rule execution skipped due to cooldown period');
        return;
      }

      switch (rule.action) {
        case 'auto_checkin':
          await this.executeAutoCheckIn(geofence, event);
          break;
        case 'auto_checkout':
          await this.executeAutoCheckOut(geofence, event);
          break;
        case 'patrol_point':
          await this.executePatrolPoint(geofence, event);
          break;
        case 'alert_only':
          await this.executeAlertOnly(geofence, event);
          break;
      }

      this.lastAutoAction = Date.now();
    } catch (error) {
      ErrorHandler.handleError(error, 'execute_geofence_rule', false);
    }
  }

  /**
   * Execute auto check-in
   */
  private async executeAutoCheckIn(geofence: GeofenceZone, event: GeofenceEvent): Promise<void> {
    try {
      if (this.config.requireConfirmation) {
        await notificationService.sendImmediateNotification(
          'Auto Check-in Available',
          `Tap to check in at ${geofence.name}`,
          {
            type: 'auto_checkin_prompt',
            geofenceId: geofence.id,
            location: event.location,
            actionData: {
              action: 'checkin',
              geofence: geofence.name,
              location: event.location,
            }
          }
        );
      } else {
        // Perform automatic check-in
        await cacheService.addToSyncQueue('auto_checkin', {
          geofenceId: geofence.id,
          location: event.location,
          timestamp: event.timestamp,
          shiftId: event.shiftId,
        });

        await notificationService.sendImmediateNotification(
          'Auto Check-in Complete',
          `Automatically checked in at ${geofence.name}`,
          { type: 'auto_checkin_complete', geofenceId: geofence.id }
        );
      }

      console.log(`🗺️ Auto check-in triggered for ${geofence.name}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'execute_auto_checkin', false);
    }
  }

  /**
   * Execute auto check-out
   */
  private async executeAutoCheckOut(geofence: GeofenceZone, event: GeofenceEvent): Promise<void> {
    try {
      if (this.config.requireConfirmation) {
        await notificationService.sendImmediateNotification(
          'Auto Check-out Available',
          `Tap to check out from ${geofence.name}`,
          {
            type: 'auto_checkout_prompt',
            geofenceId: geofence.id,
            location: event.location,
            actionData: {
              action: 'checkout',
              geofence: geofence.name,
              location: event.location,
              duration: event.duration,
            }
          }
        );
      } else {
        // Perform automatic check-out
        await cacheService.addToSyncQueue('auto_checkout', {
          geofenceId: geofence.id,
          location: event.location,
          timestamp: event.timestamp,
          duration: event.duration,
          shiftId: event.shiftId,
        });

        await notificationService.sendImmediateNotification(
          'Auto Check-out Complete',
          `Automatically checked out from ${geofence.name}`,
          { type: 'auto_checkout_complete', geofenceId: geofence.id }
        );
      }

      console.log(`🗺️ Auto check-out triggered for ${geofence.name}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'execute_auto_checkout', false);
    }
  }

  /**
   * Execute patrol point logging
   */
  private async executePatrolPoint(geofence: GeofenceZone, event: GeofenceEvent): Promise<void> {
    try {
      await cacheService.addToSyncQueue('patrol_point', {
        geofenceId: geofence.id,
        location: event.location,
        timestamp: event.timestamp,
        shiftId: event.shiftId,
      });

      await notificationService.sendImmediateNotification(
        'Patrol Point Logged',
        `Patrol point recorded at ${geofence.name}`,
        { type: 'patrol_point_logged', geofenceId: geofence.id }
      );

      console.log(`🗺️ Patrol point logged for ${geofence.name}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'execute_patrol_point', false);
    }
  }

  /**
   * Execute alert only
   */
  private async executeAlertOnly(geofence: GeofenceZone, event: GeofenceEvent): Promise<void> {
    try {
      const alertMessage = event.eventType === 'enter' 
        ? `Entered ${geofence.name}` 
        : event.eventType === 'exit'
        ? `Exited ${geofence.name}`
        : `Dwelling at ${geofence.name}`;

      await notificationService.sendImmediateNotification(
        'Geofence Alert',
        alertMessage,
        { 
          type: 'geofence_alert', 
          geofenceId: geofence.id,
          eventType: event.eventType 
        }
      );

      console.log(`🗺️ Alert sent for ${geofence.name}: ${alertMessage}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'execute_alert_only', false);
    }
  }

  /**
   * Add geofence rule
   */
  async addRule(rule: GeofenceRule): Promise<void> {
    try {
      this.rules.push(rule);
      await this.saveRules();
      console.log(`🗺️ Geofence rule added: ${rule.id}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'add_geofence_rule');
    }
  }

  /**
   * Remove geofence rule
   */
  async removeRule(ruleId: string): Promise<void> {
    try {
      this.rules = this.rules.filter(rule => rule.id !== ruleId);
      await this.saveRules();
      console.log(`🗺️ Geofence rule removed: ${ruleId}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'remove_geofence_rule');
    }
  }

  /**
   * Update geofencing configuration
   */
  async updateConfig(newConfig: Partial<AutoCheckInConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      await AsyncStorage.setItem('geofencing_config', JSON.stringify(this.config));
      console.log('🗺️ Geofencing configuration updated');
    } catch (error) {
      ErrorHandler.handleError(error, 'update_geofencing_config');
    }
  }

  /**
   * Get geofencing statistics
   */
  getGeofencingStats() {
    const totalEvents = this.geofenceEvents.length;
    const enterEvents = this.geofenceEvents.filter(e => e.eventType === 'enter').length;
    const exitEvents = this.geofenceEvents.filter(e => e.eventType === 'exit').length;
    const dwellEvents = this.geofenceEvents.filter(e => e.eventType === 'dwell').length;
    const activeGeofenceCount = this.activeGeofences.size;

    return {
      isActive: this.isActive,
      totalEvents,
      enterEvents,
      exitEvents,
      dwellEvents,
      activeGeofenceCount,
      totalRules: this.rules.length,
      activeRules: this.rules.filter(r => r.isActive).length,
      config: this.config,
    };
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('geofencing_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_geofencing_config', false);
    }
  }

  /**
   * Load rules from storage
   */
  private async loadRules(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('geofencing_rules');
      if (saved) {
        this.rules = JSON.parse(saved);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_geofencing_rules', false);
    }
  }

  /**
   * Save rules to storage
   */
  private async saveRules(): Promise<void> {
    try {
      await AsyncStorage.setItem('geofencing_rules', JSON.stringify(this.rules));
    } catch (error) {
      ErrorHandler.handleError(error, 'save_geofencing_rules', false);
    }
  }

  /**
   * Load geofence events from storage
   */
  private async loadGeofenceEvents(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('geofence_events');
      if (saved) {
        this.geofenceEvents = JSON.parse(saved);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_geofence_events', false);
    }
  }

  /**
   * Save geofence events to storage
   */
  private async saveGeofenceEvents(): Promise<void> {
    try {
      // Keep only recent events to prevent storage bloat
      const recentEvents = this.geofenceEvents.slice(-100);
      await AsyncStorage.setItem('geofence_events', JSON.stringify(recentEvents));
    } catch (error) {
      ErrorHandler.handleError(error, 'save_geofence_events', false);
    }
  }

  /**
   * Get recent geofence events
   */
  getRecentEvents(limit: number = 20): GeofenceEvent[] {
    return this.geofenceEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get active geofences
   */
  getActiveGeofences(): string[] {
    return Array.from(this.activeGeofences.keys());
  }

  /**
   * Get geofence rules
   */
  getRules(): GeofenceRule[] {
    return [...this.rules];
  }

  /**
   * Clear all events
   */
  async clearEvents(): Promise<void> {
    try {
      this.geofenceEvents = [];
      await AsyncStorage.removeItem('geofence_events');
      console.log('🗺️ Geofence events cleared');
    } catch (error) {
      ErrorHandler.handleError(error, 'clear_geofence_events');
    }
  }
}

export default new GeofencingService();
export type { GeofenceEvent, AutoCheckInConfig, GeofenceRule };
