import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import { apiService } from './api';
import { websocketService } from './websocketService';
import { useAppStore } from '../store/useAppStore';

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private backgroundInterval: NodeJS.Timeout | null = null;
  private isWatching: boolean = false;
  private currentRoomId: string | null = null;
  private activeRooms: Set<string> = new Set();
  private isInForeground: boolean = true;
  private lastLocation: { latitude: number; longitude: number } | null = null;
  private lastSentLocation: { latitude: number; longitude: number; timestamp: number } | null = null;

  private appStateSubscription: any = null;
  
  // Throttling configuration
  private readonly MIN_DISTANCE_CHANGE = 100; // Minimum distance change in meters (100m = ~0.1km)
  private readonly MIN_TIME_INTERVAL = 30000; // Minimum time between updates in ms (30 seconds)
  private readonly FOREGROUND_TIME_INTERVAL = 30000; // 30 seconds in foreground (instead of 10)
  private readonly BACKGROUND_TIME_INTERVAL = 60000; // 60 seconds in background (instead of 30)
  private readonly FOREGROUND_DISTANCE_INTERVAL = 100; // 100 meters in foreground (instead of 50)
  
  // Helper method to determine if we should send location update
  private shouldSendLocationUpdate(latitude: number, longitude: number, timestamp: number): boolean {
    // If we haven't sent any location yet, send it
    if (!this.lastSentLocation) {
      return true;
    }
    
    // Check time interval
    const timeSinceLastSend = timestamp - this.lastSentLocation.timestamp;
    if (timeSinceLastSend < this.MIN_TIME_INTERVAL) {
      return false; // Too soon, skip
    }
    
    // Check distance change
    const distance = calculateDistance(
      this.lastSentLocation.latitude,
      this.lastSentLocation.longitude,
      latitude,
      longitude
    );
    
    if (distance < this.MIN_DISTANCE_CHANGE) {
      return false; // Not moved enough, skip
    }
    
    return true; // Enough time and distance change, send it
  }

  constructor() {
    // Initialize app state
    this.isInForeground = AppState.currentState === 'active';
    
    // Listen to app state changes
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.handleAppStateChange(nextAppState);
    });
  }

  private handleAppStateChange(nextAppState: AppStateStatus) {
    const wasInForeground = this.isInForeground;
    this.isInForeground = nextAppState === 'active';

    if (!wasInForeground && this.isInForeground) {
      // App came to foreground - resume real-time tracking
      console.log('[LocationService] 📱 App came to foreground, resuming real-time tracking');
      if (this.currentRoomId) {
        this.stopBackgroundTracking();
        this.startLocationTracking(this.currentRoomId);
      } else if (this.activeRooms.size > 0) {
        // Start tracking for first active room if any
        const firstRoomId = Array.from(this.activeRooms)[0];
        this.startLocationTracking(firstRoomId);
      }
    } else if (wasInForeground && !this.isInForeground) {
      // App went to background - switch to interval-based tracking
      console.log('[LocationService] 📱 App went to background, switching to interval tracking');
      if (this.currentRoomId || this.activeRooms.size > 0) {
        // Stop real-time tracking
        if (this.watchSubscription) {
          this.watchSubscription.remove();
          this.watchSubscription = null;
          this.isWatching = false;
        }
        // Start background tracking
        this.startBackgroundTracking();
      }
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Try requesting background permissions for Android
        try {
          const bgStatus = await Location.requestBackgroundPermissionsAsync();
          return bgStatus.status === 'granted';
        } catch {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  addActiveRoom(roomId: string) {
    // Skip if already in active rooms
    if (this.activeRooms.has(roomId)) {
      return;
    }
    
    this.activeRooms.add(roomId);
    
    // If in background, start background tracking if not already running
    if (!this.isInForeground && !this.backgroundInterval) {
      this.startBackgroundTracking();
    }
  }

  removeActiveRoom(roomId: string) {
    const hadRoom = this.activeRooms.has(roomId);
    this.activeRooms.delete(roomId);
    
    if (hadRoom) {
      console.log('[LocationService] Removed room from active rooms:', roomId, `Remaining: ${this.activeRooms.size}`);
    }
    
    // If no active rooms, stop background tracking
    if (this.activeRooms.size === 0 && this.backgroundInterval) {
      this.stopBackgroundTracking();
    }
  }

  async startLocationTracking(roomId: string) {
    // Skip if already tracking this room
    if (this.isWatching && this.currentRoomId === roomId) {
      console.log('[LocationService] Already tracking room:', roomId);
      return; // Already tracking, no need to restart
    }

    // Add room to active rooms first (will skip if already added)
    this.addActiveRoom(roomId);
    
    // Skip if already tracking this room (check again after adding to active rooms)
    if (this.isWatching && this.currentRoomId === roomId) {
      return;
    }

    // Stop background tracking if running (only if going to foreground tracking)
    if (this.backgroundInterval && this.isInForeground) {
      console.log('[LocationService] Stopping background tracking, starting foreground tracking');
      this.stopBackgroundTracking();
    }

    // Stop previous tracking if different room (only in foreground)
    if (this.isWatching && this.currentRoomId !== roomId && this.isInForeground) {
      console.log('[LocationService] Switching tracking from room:', this.currentRoomId, 'to:', roomId);
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
        this.isWatching = false;
      }
    }

    this.currentRoomId = roomId;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Location permission not granted');
      return;
    }

    try {
      // Use optimized intervals to reduce frequency
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced to reduce battery usage
          timeInterval: this.FOREGROUND_TIME_INTERVAL, // 30 seconds instead of 10
          distanceInterval: this.FOREGROUND_DISTANCE_INTERVAL, // 100 meters instead of 50
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          const now = Date.now();
          
          // Check if we should send this update
          const shouldSend = this.shouldSendLocationUpdate(latitude, longitude, now);
          
          if (!shouldSend) {
            // Update lastLocation but don't send
            this.lastLocation = { latitude, longitude };
            return;
          }
          
          this.lastLocation = { latitude, longitude };
          this.lastSentLocation = { latitude, longitude, timestamp: now };
          
          try {
            // Send to backend via API
            await apiService.updateLocation(roomId, latitude, longitude);
            
            // Also send via WebSocket for real-time updates (only in foreground)
            if (this.isInForeground) {
              const timestamp = new Date().toISOString();
              websocketService.sendLocationUpdate(roomId, latitude, longitude, timestamp);
            }
            
            console.log('[LocationService] 📍 Location sent to room:', roomId, `(${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
          } catch (error) {
            console.error('[LocationService] ❌ Error updating location for room', roomId, ':', error);
          }
        }
      );

      this.isWatching = true;
      console.log('[LocationService] ✅ Location tracking started for room:', roomId, `Mode: ${this.isInForeground ? 'foreground' : 'background'}`);
    } catch (error) {
      console.error('[LocationService] ❌ Error starting location tracking:', error);
      this.isWatching = false;
      this.currentRoomId = null;
    }
  }

  private async startBackgroundTracking() {
    if (this.backgroundInterval) {
      console.log('[LocationService] Background tracking already running');
      return; // Already running
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('[LocationService] ⚠️ Location permission not granted for background tracking');
      return;
    }

    console.log('[LocationService] 🔄 Starting background location tracking (60s interval) for', this.activeRooms.size, 'room(s)');
    
    // Send location immediately (if enough time/distance has passed)
    await this.sendLocationToActiveRooms();

    // Set up interval to send location every 60 seconds (reduced frequency)
    this.backgroundInterval = setInterval(async () => {
      await this.sendLocationToActiveRooms();
    }, this.BACKGROUND_TIME_INTERVAL); // 60 seconds instead of 30
  }

  private stopBackgroundTracking() {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
      console.log('[LocationService] ⏹️ Background tracking stopped');
    }
  }

  private async sendLocationToActiveRooms() {
    try {
      // If no active rooms, skip
      if (this.activeRooms.size === 0) {
        return;
      }

      // Get current location
      const location = await this.getCurrentLocation();
      if (!location) {
        console.warn('[LocationService] ⚠️ Could not get location for background tracking');
        return;
      }

      const { latitude, longitude } = location.coords;
      const now = Date.now();
      
      // Check if we should send this update
      const shouldSend = this.shouldSendLocationUpdate(latitude, longitude, now);
      
      if (!shouldSend) {
        // Update lastLocation but don't send
        this.lastLocation = { latitude, longitude };
        console.log('[LocationService] ⏭️ Skipping background location update (too soon or not moved enough)');
        return;
      }
      
      this.lastLocation = { latitude, longitude };
      this.lastSentLocation = { latitude, longitude, timestamp: now };

      // Send to all active rooms (batch requests)
      const roomsArray = Array.from(this.activeRooms);
      const updatePromises = roomsArray.map(async (roomId) => {
        try {
          await apiService.updateLocation(roomId, latitude, longitude);
        } catch (error) {
          console.error('[LocationService] ❌ Error updating location for room', roomId, ':', error);
        }
      });

      await Promise.all(updatePromises);
      console.log('[LocationService] 📍 Background location sent to', roomsArray.length, 'room(s)', `(${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
    } catch (error) {
      console.error('[LocationService] ❌ Error in background location tracking:', error);
    }
  }

  stopLocationTracking(roomId?: string) {
    if (roomId) {
      // Skip if room is not in active rooms
      if (!this.activeRooms.has(roomId)) {
        return;
      }

      // Remove specific room
      this.removeActiveRoom(roomId);
      
      // Only stop real-time tracking if this was the current room
      if (this.currentRoomId === roomId) {
        this.currentRoomId = null;
        
        // Stop real-time tracking if we were tracking this room (only in foreground)
        if (this.watchSubscription && this.isInForeground) {
          this.watchSubscription.remove();
          this.watchSubscription = null;
          this.isWatching = false;
        }
        
        // If in foreground and have other active rooms, start tracking one of them
        if (this.isInForeground && this.activeRooms.size > 0) {
          const nextRoomId = Array.from(this.activeRooms)[0];
          this.startLocationTracking(nextRoomId);
        }
      }

      // If still have active rooms and in background, keep background tracking
      if (this.activeRooms.size > 0 && !this.isInForeground) {
        return; // Keep background tracking for other rooms
      }

      // If no more active rooms, stop everything
      if (this.activeRooms.size === 0) {
        console.log('[LocationService] ⏹️ Stopping all tracking - no active rooms');
        if (this.watchSubscription) {
          this.watchSubscription.remove();
          this.watchSubscription = null;
          this.isWatching = false;
        }
        this.stopBackgroundTracking();
      }
    } else {
      // Stop all tracking
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
        this.isWatching = false;
      }
      this.stopBackgroundTracking();
      this.currentRoomId = null;
      this.activeRooms.clear();
      
      // Remove app state listener
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
      
      console.log('[LocationService] ⏹️ All location tracking stopped');
    }
  }

  isTracking(): boolean {
    return this.isWatching;
  }

  async getLocations(roomId: string) {
    try {
      const response = await apiService.getLocations(roomId);
      return response;
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
