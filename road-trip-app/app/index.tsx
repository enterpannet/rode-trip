import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MapScreen } from './screens/MapScreen';
import { ChatScreen } from './screens/ChatScreen';
import { VoiceCallScreen } from './screens/VoiceCallScreen';
import { MembersScreen } from './screens/MembersScreen';
import { IncomingCallNotification } from './components/IncomingCallNotification';
import { useAppStore } from './store/useAppStore';
import { apiService } from './services/api';
import { websocketService } from './services/websocketService';
import { locationService } from './services/locationService';

const Stack = createStackNavigator();

export default function App() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const rooms = useAppStore((state) => state.rooms);
  const callState = useAppStore((state) => state.callState);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        // First, test backend connectivity
        try {
          await apiService.healthCheck();
          console.log('[App] ✅ Backend is reachable');
        } catch (healthError) {
          console.error('[App] ❌ Backend is not reachable - please check:');
          console.error('[App] 1. Is the backend server running?');
          console.error('[App] 2. Is the IP address correct in app.json?');
          console.error('[App] 3. Are you on the same network?');
          console.error('[App] 4. Is the firewall blocking connections?');
          return; // Don't proceed if backend is not reachable
        }
        
        try {
          const currentUser = await apiService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            await websocketService.connect();
            
            // Load user rooms and add to active rooms for background tracking
            try {
              const userRooms = await apiService.getRooms();
              userRooms.forEach((room: any) => {
                locationService.addActiveRoom(room.id);
              });
            } catch (error) {
              console.error('[App] ❌ Error loading rooms:', error);
            }
          }
        } catch (authError) {
          // User not authenticated, show login screen
          console.log('[App] ℹ️ Not authenticated');
        }
      } catch (error) {
        console.error('[App] ❌ Error during auth check:', error);
      }
    };

    checkAuth();

    // Handle app state changes for location tracking
    // Note: LocationService already has its own AppState listener, so this is just a backup
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // LocationService will handle app state changes internally
      // No need to duplicate the logic here
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
      subscription.remove();
      // Stop all location tracking on logout
      locationService.stopLocationTracking();
    };
    }, []); // Only run once on mount

  const handleAcceptCall = async () => {
    if (callState?.call && callState.isIncoming) {
      try {
        const { voiceCallService } = await import('./services/voiceCallService');
        await voiceCallService.acceptCall(callState.call);
        // Navigate to VoiceCallScreen
        navigationRef.current?.navigate('VoiceCall');
      } catch (error) {
        console.error('[App] ❌ Error accepting call:', error);
      }
    }
  };

  const handleRejectCall = () => {
    if (callState?.call && callState.isIncoming) {
      const { voiceCallService } = require('./services/voiceCallService');
      voiceCallService.rejectCall(callState.call);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {!user ? (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Road Trip Buddy' }}
              />
              <Stack.Screen
                name="Map"
                component={MapScreen}
                options={{ title: 'Map' }}
              />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{ title: 'Chat' }}
              />
              <Stack.Screen
                name="VoiceCall"
                component={VoiceCallScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Members"
                component={MembersScreen}
                options={{ title: 'Members' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* Incoming Call Notification */}
      {callState?.isIncoming && callState?.call && (
        <IncomingCallNotification
          call={callState.call}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </SafeAreaProvider>
  );
}
