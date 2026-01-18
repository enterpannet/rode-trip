import * as Location from 'expo-location';
import { apiService } from './api';
import { websocketService } from './websocketService';
import { useAppStore } from '../store/useAppStore';

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private isWatching: boolean = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
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

  async startLocationTracking(roomId: string) {
    if (this.isWatching) {
      console.warn('Location tracking already started');
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Location permission not granted');
      return;
    }

    try {
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          
          try {
            // Send to backend via API
            await apiService.updateLocation(roomId, latitude, longitude);
            
            // Also send via WebSocket for real-time updates
            websocketService.sendLocationUpdate(roomId, latitude, longitude);
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      );

      this.isWatching = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  stopLocationTracking() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
      this.isWatching = false;
      console.log('Location tracking stopped');
    }
  }

  isTracking(): boolean {
    return this.isWatching;
  }
}

export const locationService = new LocationService();
