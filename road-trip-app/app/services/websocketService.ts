import Constants from 'expo-constants';
import { useAppStore } from '../store/useAppStore';
import { apiService } from './api';

const BASE_WS_URL = Constants.expoConfig?.extra?.wsUrl || process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000/ws';

// Log WebSocket URL for debugging
console.log('[WebSocketService] 📡 WebSocket URL configured:', BASE_WS_URL);
console.log('[WebSocketService] 📡 Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
console.log('[WebSocketService] 📡 process.env.EXPO_PUBLIC_WS_URL:', process.env.EXPO_PUBLIC_WS_URL);

type WebSocketEvent =
  | { type: 'join-room'; room_id: string }
  | { type: 'leave-room'; room_id: string }
  | { type: 'new-message'; room_id: string; text: string }
  | { type: 'image-message'; room_id: string; image_url: string }
  | { type: 'typing'; room_id: string; user_id?: string }
  | { type: 'location-update'; room_id: string; user_id: string; latitude: number; longitude: number; timestamp: string }
  | { type: 'voice-call-initiate'; room_id: string }
  | { type: 'voice-call-accept'; call_id: string }
  | { type: 'voice-call-reject'; call_id: string }
  | { type: 'voice-call-end'; call_id: string }
  | { type: 'voice-offer'; call_id: string; offer: string }
  | { type: 'voice-answer'; call_id: string; answer: string }
  | { type: 'ice-candidate'; call_id: string; candidate: string };

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  async connect() {
    // Check if already connected or connecting
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        console.log('[WebSocketService] ⚠️ Already connected');
        return;
      }
      if (this.socket.readyState === WebSocket.CONNECTING) {
        console.log('[WebSocketService] ⚠️ Already connecting');
        return;
      }
      // If socket exists but not open/connecting, clean it up first
      try {
        this.socket.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.socket = null;
    }

    try {
      // Get session token for WebSocket authentication
      let sessionToken: string | null = null;
      try {
        sessionToken = await apiService.getSessionToken();
        console.log('[WebSocketService] ✅ Got session token for WebSocket');
      } catch (error: any) {
        console.error('[WebSocketService] ❌ Failed to get session token:', error?.message || error);
        // Don't connect if we can't get session token
        // Don't schedule reconnect here as it might be an auth issue
        return;
      }

      if (!sessionToken) {
        console.error('[WebSocketService] ❌ No session token available');
        return;
      }

      // Build WebSocket URL with session token
      const wsUrl = `${BASE_WS_URL}?token=${encodeURIComponent(sessionToken)}`;
      console.log('[WebSocketService] 🔌 Connecting to WebSocket...');
      
      this.socket = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error: any) {
      console.error('[WebSocketService] ❌ Failed to create WebSocket:', error?.message || error);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      // Close with code 1000 (normal closure) to indicate intentional disconnect
      this.socket.close(1000, 'Intentional disconnect');
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      console.log('[WebSocketService] 🔌 Disconnected intentionally');
    }
  }

  private async scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocketService] ❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(async () => {
      console.log(`[WebSocketService] 🔄 Reconnecting... (attempt ${this.reconnectAttempts})`);
      await this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('[WebSocketService] ✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = (event) => {
      console.log('[WebSocketService] 🔌 WebSocket disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      this.isConnected = false;
      
      // Only reconnect if it wasn't a clean close (code 1000) or intentional disconnect
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocketService] ❌ Max reconnection attempts reached');
      }
    };

    this.socket.onerror = (error) => {
      console.error('[WebSocketService] ❌ WebSocket connection error:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('[WebSocketService] Error details:', error.message, error.stack);
      }
      // Error event usually followed by close event, so we'll handle reconnection there
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  private handleMessage(data: any) {
    // Handle different message types based on backend WebSocketEvent
    if (data.type) {
      switch (data.type) {
        case 'user-joined':
          console.log('User joined:', data);
          break;
        case 'user-left':
          console.log('User left:', data);
          break;
        case 'new-message':
          console.log('New message:', data);
          if (data.message_id && data.user_id && data.room_id) {
            useAppStore.getState().addMessage({
              id: data.message_id,
              room_id: data.room_id,
              user_id: data.user_id,
              text: data.text,
              image_url: data.image_url,
              message_type: data.message_type || 'text',
              created_at: new Date().toISOString(),
            });
          }
          break;
        case 'user-typing':
          console.log('User typing:', data);
          break;
        case 'location-update':
          console.log('Location update:', data);
          if (data.user_id && data.room_id && data.latitude && data.longitude) {
            useAppStore.getState().updateLocation({
              id: data.location_id || `temp-${Date.now()}`,
              user_id: data.user_id,
              room_id: data.room_id,
              latitude: data.latitude,
              longitude: data.longitude,
              timestamp: data.timestamp || new Date().toISOString(),
            });
          }
          break;
        case 'voice-call-incoming':
          console.log('[WebSocket] 📞 Incoming call:', data);
          if (data.call_id && data.room_id && data.initiator_id) {
            const store = useAppStore.getState();
            const userId = store.user?.id;
            
            const incomingCall = {
              id: data.call_id,
              room_id: data.room_id,
              initiator_id: data.initiator_id,
              start_time: new Date().toISOString(),
              status: 'ringing' as const,
            };
            
            // Only show incoming call if we're not the initiator
            if (userId && userId !== data.initiator_id) {
              store.setIncomingCall(incomingCall);
            } else {
              // If we're the initiator, set call state so we can navigate to VoiceCallScreen
              store.setCallState({
                call: incomingCall,
                isIncoming: false,
                isActive: false,
                callDuration: 0,
              });
              console.log('[WebSocket] 📞 We are the initiator, call state set');
            }
          }
          break;
        case 'voice-call-accepted':
          console.log('[WebSocket] ✅ Call accepted:', data);
          if (data.call_id) {
            const store = useAppStore.getState();
            const currentCall = store.callState?.call;
            
            // Update call state if we have a current call
            if (currentCall && currentCall.id === data.call_id) {
              store.setCallAccepted(currentCall);
              
              // If we're the initiator, create and send offer now that call is accepted
              if (currentCall.initiator_id === store.user?.id) {
                import('./voiceCallService').then(({ voiceCallService }) => {
                  voiceCallService.createOfferForCall(currentCall);
                });
              }
            }
          }
          break;
        case 'voice-call-rejected':
          console.log('Call rejected:', data);
          useAppStore.getState().setCallRejected();
          break;
        case 'voice-call-ended':
          console.log('Call ended:', data);
          useAppStore.getState().endCall();
          break;
        case 'voice-offer':
          console.log('Voice offer received:', data);
          if (data.call_id && data.offer) {
            const store = useAppStore.getState();
            if (store.callState?.call) {
              // Handle offer in voice call service
              import('./voiceCallService').then(({ voiceCallService }) => {
                voiceCallService.handleOffer(store.callState!.call!, data.offer);
              });
            }
          }
          break;
        case 'voice-answer':
          console.log('Voice answer received:', data);
          if (data.call_id && data.answer) {
            const store = useAppStore.getState();
            if (store.callState?.call) {
              // Handle answer in voice call service
              import('./voiceCallService').then(({ voiceCallService }) => {
                voiceCallService.handleAnswer(store.callState!.call!, data.answer);
              });
            }
          }
          break;
        case 'ice-candidate':
          console.log('ICE candidate received:', data);
          if (data.call_id && data.candidate) {
            const store = useAppStore.getState();
            if (store.callState?.call) {
              // Handle ICE candidate in voice call service
              import('./voiceCallService').then(({ voiceCallService }) => {
                voiceCallService.handleIceCandidate(store.callState!.call!, data.candidate);
              });
            }
          }
          break;
        default:
          console.log('Unknown message type:', data);
      }
    }
  }

  private send(event: WebSocketEvent) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Room events
  joinRoom(roomId: string) {
    this.send({ type: 'join-room', room_id: roomId });
  }

  leaveRoom(roomId: string) {
    this.send({ type: 'leave-room', room_id: roomId });
  }

  // Message events
  sendMessage(roomId: string, text: string, imageUrl?: string) {
    if (imageUrl) {
      this.send({ type: 'image-message', room_id: roomId, image_url: imageUrl });
    } else {
      this.send({ type: 'new-message', room_id: roomId, text });
    }
  }

  sendTyping(roomId: string) {
    this.send({
      type: 'typing',
      room_id: roomId,
      user_id: useAppStore.getState().user?.id,
    });
  }

  // Location events
  sendLocationUpdate(roomId: string, latitude: number, longitude: number, timestamp: string) {
    const userId = useAppStore.getState().user?.id;
    if (!userId) {
      console.warn('[WebSocketService] ⚠️ Cannot send location update - user not logged in');
      return;
    }
    
    this.send({
      type: 'location-update',
      room_id: roomId,
      user_id: userId,
      latitude,
      longitude,
      timestamp,
    });
  }

  // Voice call events
  initiateCall(roomId: string, initiatorId: string) {
    this.send({ type: 'voice-call-initiate', room_id: roomId, initiator_id: initiatorId });
  }

  acceptCall(callId: string, userId: string) {
    this.send({ type: 'voice-call-accept', call_id: callId, user_id: userId });
  }

  rejectCall(callId: string, userId: string) {
    this.send({ type: 'voice-call-reject', call_id: callId, user_id: userId });
  }

  endCall(callId: string, userId: string) {
    this.send({ type: 'voice-call-end', call_id: callId, user_id: userId });
  }

  // WebRTC signaling
  sendOffer(callId: string, offer: string) {
    this.send({ type: 'voice-offer', call_id: callId, offer });
  }

  sendAnswer(callId: string, answer: string) {
    this.send({ type: 'voice-answer', call_id: callId, answer });
  }

  sendIceCandidate(callId: string, candidate: string) {
    this.send({ type: 'ice-candidate', call_id: callId, candidate });
  }
}

export const websocketService = new WebSocketService();
