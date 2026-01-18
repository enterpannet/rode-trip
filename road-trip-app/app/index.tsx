import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MapScreen } from './screens/MapScreen';
import { ChatScreen } from './screens/ChatScreen';
import { VoiceCallScreen } from './screens/VoiceCallScreen';
import { MembersScreen } from './screens/MembersScreen';
import { useAppStore } from './store/useAppStore';
import { apiService } from './services/api';
import { websocketService } from './services/websocketService';

const Stack = createStackNavigator();

export default function App() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const currentUser = await apiService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          websocketService.connect();
        }
      } catch (error) {
        // User not authenticated, show login screen
        console.log('Not authenticated');
      }
    };

    checkAuth();

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [setUser]);

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
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
    </>
  );
}
