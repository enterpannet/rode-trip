import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAppStore } from '../store/useAppStore';
import { locationService } from '../services/locationService';
import { websocketService } from '../services/websocketService';
import { Location, Room } from '../types';

interface MapScreenProps {
  navigation: any;
  route: {
    params: {
      room: Room;
    };
  };
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation, route }) => {
  const { room } = route.params;
  const [isTracking, setIsTracking] = useState(false);
  const locations = useAppStore((state) => state.locations.filter((loc) => loc.room_id === room.id));
  const updateLocation = useAppStore((state) => state.updateLocation);
  const setLocations = useAppStore((state) => state.setLocations);
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    // Join room WebSocket
    websocketService.joinRoom(room.id);

    // Load initial locations
    loadLocations();

    // Setup location tracking
    if (!isTracking) {
      startLocationTracking();
    }

    return () => {
      // Stop tracking and leave room when unmounting
      if (isTracking) {
        locationService.stopLocationTracking();
      }
      websocketService.leaveRoom(room.id);
    };
  }, [room.id]);

  const loadLocations = async () => {
    try {
      const response = await locationService.getLocations(room.id);
      setLocations(response.locations || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      await locationService.startLocationTracking(room.id);
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    locationService.stopLocationTracking();
    setIsTracking(false);
  };

  const navigateToChat = () => {
    navigation.navigate('Chat', { room });
  };

  const navigateToMembers = () => {
    navigation.navigate('Members', { room });
  };

  // Get user locations for markers
  const userLocationsMap = new Map<string, Location>();
  locations.forEach((loc) => {
    const existing = userLocationsMap.get(loc.user_id);
    if (!existing || new Date(loc.timestamp) > new Date(existing.timestamp)) {
      userLocationsMap.set(loc.user_id, loc);
    }
  });

  const markers = Array.from(userLocationsMap.values());

  // Calculate region to show all markers
  const getRegion = () => {
    if (markers.length === 0) {
      return {
        latitude: 13.7563, // Default to Bangkok
        longitude: 100.5018,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const latitudes = markers.map((m) => m.latitude);
    const longitudes = markers.map((m) => m.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = (maxLat - minLat) * 1.5 || 0.1;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.1;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={getRegion()}
        region={getRegion()}
      >
        {markers.map((location) => (
          <Marker
            key={`${location.user_id}-${location.timestamp}`}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.user_id === user?.id ? 'You' : 'Member'}
            description={new Date(location.timestamp).toLocaleTimeString()}
          />
        ))}
      </MapView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isTracking && styles.buttonActive]}
          onPress={isTracking ? stopLocationTracking : startLocationTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={navigateToChat}>
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={navigateToMembers}>
          <Text style={styles.buttonText}>Members</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  buttonActive: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
