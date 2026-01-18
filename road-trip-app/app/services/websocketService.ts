import Constants from 'expo-constants';
import { useAppStore } from '../store/useAppStore';

const WS_URL = Constants.expoConfig?.extra?.wsUrl || process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000/ws';

type WebSocketEvent =
  | { type: 'join-room'; room_id: string }
  | { type: 'leave-room'; room_id: string }
  | { type: 'new-message'; room_id: string; text: string }
  | { type: 'image-message'; room_id: string; image_url: string }
  | { type: 'typing'; room_id: string; user_id?: string }
  | { type: 'location-update'; room_id: string; latitude: number; longitude: number }
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

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.socket = new WebSocket(WS_URL);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket connection error:', error);
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
          if (data.user_id && data.latitude && data.longitude) {
            useAppStore.getState().updateLocation({
              user_id: data.user_id,
              latitude: data.latitude,
              longitude: data.longitude,
              updated_at: new Date().toISOString(),
            });
          }
          break;
        case 'voice-call-incoming':
          console.log('Incoming call:', data);
          useAppStore.getState().setIncomingCall(data);
          break;
        case 'voice-call-accepted':
          console.log('Call accepted:', data);
          useAppStore.getState().setCallAccepted(data);
          break;
        case 'voice-call-rejected':
          console.log('Call rejected:', data);
          useAppStore.getState().setCallRejected(data);
          break;
        case 'voice-call-ended':
          console.log('Call ended:', data);
          useAppStore.getState().endCall();
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
  sendLocationUpdate(roomId: string, latitude: number, longitude: number) {
    this.send({
      type: 'location-update',
      room_id: roomId,
      latitude,
      longitude,
    });
  }

  // Voice call events
  initiateCall(roomId: string) {
    this.send({ type: 'voice-call-initiate', room_id: roomId });
  }

  acceptCall(callId: string) {
    this.send({ type: 'voice-call-accept', call_id: callId });
  }

  rejectCall(callId: string) {
    this.send({ type: 'voice-call-reject', call_id: callId });
  }

  endCall(callId: string) {
    this.send({ type: 'voice-call-end', call_id: callId });
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
