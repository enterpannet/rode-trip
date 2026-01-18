import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useAppStore } from '../store/useAppStore';
import { locationService } from '../services/locationService';
import { websocketService } from '../services/websocketService';
import { voiceCallService } from '../services/voiceCallService';
import { apiService } from '../services/api';
import { Location, Room, User } from '../types';

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
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [roomMembers, setRoomMembers] = useState<User[]>([]);
  const insets = useSafeAreaInsets();
  const locations = useAppStore((state) => state.locations.filter((loc) => loc.room_id === room.id));
  const updateLocation = useAppStore((state) => state.updateLocation);
  const setLocations = useAppStore((state) => state.setLocations);
  const user = useAppStore((state) => state.user);
  
  // Tracking is automatic when in MapScreen, so we'll always show as tracking
  // The locationService handles tracking automatically based on app state and active rooms
  const isTracking = true; // Always true since tracking starts automatically when entering this screen

  const trackingStartedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (trackingStartedRef.current) {
      return;
    }

    trackingStartedRef.current = true;

    // Add room to active rooms first (will skip if already added)
    locationService.addActiveRoom(room.id);

    // Join room WebSocket
    websocketService.joinRoom(room.id);

    // Load room members
    loadRoomMembers();

    // Load initial locations
    loadLocations();

    // Get current location
    getCurrentLocation();

    // Setup location tracking (real-time when in this screen)
    locationService.startLocationTracking(room.id);

    return () => {
      trackingStartedRef.current = false;
      // Leave WebSocket room
      websocketService.leaveRoom(room.id);
      
      // Note: Don't remove room from active rooms or stop tracking on cleanup
      // because user might navigate between screens but still be in a room
      // The room will be removed when user actually leaves the room (e.g., from HomeScreen)
    };
  }, [room.id]);

  const loadRoomMembers = useCallback(async () => {
    try {
      const members = await apiService.getRoomMembers(room.id);
      setRoomMembers(members || []);
      console.log('[MapScreen] ✅ Loaded', (members || []).length, 'room members');
    } catch (error) {
      console.error('[MapScreen] ❌ Error loading room members:', error);
    }
  }, [room.id]);

  const loadLocations = useCallback(async () => {
    try {
      const response = await locationService.getLocations(room.id);
      if (response && response.locations) {
        // Map response locations to include room_id
        const locationsWithRoomId = response.locations.map((loc: any) => ({
          ...loc,
          room_id: room.id,
        }));
        setLocations(locationsWithRoomId);
        console.log('[MapScreen] ✅ Loaded', locationsWithRoomId.length, 'locations for room:', room.id);
      }
    } catch (error) {
      console.error('[MapScreen] ❌ Error loading locations:', error);
    }
  }, [room.id, setLocations]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }, []);

  // Tracking is now automatic - no manual start/stop needed

  const navigateToChat = () => {
    navigation.navigate('Chat', { room });
  };

  const navigateToMembers = () => {
    navigation.navigate('Members', { room });
  };

  const handleCall = async () => {
    try {
      await voiceCallService.initiateCall(room.id);
      // Navigate to voice call screen
      navigation.navigate('VoiceCall');
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  // Get user locations for markers (get latest location for each user) - memoized
  const markers = useMemo(() => {
    const userLocationsMap = new Map<string, Location>();
    locations.forEach((loc) => {
      // Only process locations for this room
      if (loc.room_id === room.id) {
        const existing = userLocationsMap.get(loc.user_id);
        if (!existing || new Date(loc.timestamp) > new Date(existing.timestamp)) {
          userLocationsMap.set(loc.user_id, loc);
        }
      }
    });
    return Array.from(userLocationsMap.values());
  }, [locations, room.id]);
  
  // Get user name helper - memoized
  const getUserName = useCallback((userId: string): string => {
    if (userId === user?.id) {
      return user.name || 'You';
    }
    const member = roomMembers.find((m) => m.id === userId);
    return member?.name || 'Member';
  }, [user, roomMembers]);

  // Calculate region to show all markers - memoized
  const mapRegion = useMemo(() => {
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
  }, [markers]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={isTracking}
      >
        {/* Show markers for all room members */}
        {markers.map((location) => {
          const isCurrentUser = location.user_id === user?.id;
          return (
            <Marker
              key={`${location.user_id}-${location.timestamp}`}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={getUserName(location.user_id)}
              description={`Updated: ${new Date(location.timestamp).toLocaleTimeString()}`}
              pinColor={isCurrentUser ? '#007AFF' : '#34C759'}
            />
          );
        })}
      </MapView>

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.button} onPress={navigateToChat}>
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.callButton]} onPress={handleCall}>
          <Text style={styles.buttonText}>📞 Call</Text>
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
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
    minWidth: 80,
  },
  callButton: {
    backgroundColor: '#34C759',
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
