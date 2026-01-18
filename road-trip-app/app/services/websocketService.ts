import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { useAppStore } from '../store/useAppStore';

const WS_URL = Constants.expoConfig?.extra?.wsUrl || process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Room events
    this.socket.on('user-joined', (data: { room_id: string; user_id: string }) => {
      console.log('User joined:', data);
      // Update store if needed
    });

    this.socket.on('user-left', (data: { room_id: string; user_id: string }) => {
      console.log('User left:', data);
    });

    // Message events
    this.socket.on('message', (message: any) => {
      console.log('New message:', message);
      useAppStore.getState().addMessage(message);
    });

    this.socket.on('user-typing', (data: { room_id: string; user_id: string }) => {
      console.log('User typing:', data);
      // Handle typing indicator
    });

    // Location events
    this.socket.on('location-update', (location: any) => {
      console.log('Location update:', location);
      useAppStore.getState().updateLocation(location);
    });

    // Voice call events
    this.socket.on('voice-call-incoming', (data: any) => {
      console.log('Incoming call:', data);
      useAppStore.getState().setIncomingCall(data);
    });

    this.socket.on('voice-call-accepted', (data: any) => {
      console.log('Call accepted:', data);
      useAppStore.getState().setCallAccepted(data);
    });

    this.socket.on('voice-call-rejected', (data: any) => {
      console.log('Call rejected:', data);
      useAppStore.getState().setCallRejected(data);
    });

    this.socket.on('voice-call-ended', (data: any) => {
      console.log('Call ended:', data);
      useAppStore.getState().endCall();
    });
  }

  // Room events
  joinRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', { room_id: roomId });
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', { room_id: roomId });
    }
  }

  // Message events
  sendMessage(roomId: string, text: string, imageUrl?: string) {
    if (this.socket && this.isConnected) {
      if (imageUrl) {
        this.socket.emit('image-message', {
          room_id: roomId,
          image_url: imageUrl,
        });
      } else {
        this.socket.emit('new-message', {
          room_id: roomId,
          text,
        });
      }
    }
  }

  sendTyping(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', {
        room_id: roomId,
        user_id: useAppStore.getState().user?.id,
      });
    }
  }

  // Location events
  sendLocationUpdate(roomId: string, latitude: number, longitude: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('location-update', {
        room_id: roomId,
        latitude,
        longitude,
      });
    }
  }

  // Voice call events
  initiateCall(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice-call-initiate', {
        room_id: roomId,
      });
    }
  }

  acceptCall(callId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice-call-accept', {
        call_id: callId,
      });
    }
  }

  rejectCall(callId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice-call-reject', {
        call_id: callId,
      });
    }
  }

  endCall(callId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice-call-end', {
        call_id: callId,
      });
    }
  }

  // WebRTC signaling
  sendOffer(callId: string, offer: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice-offer', {
        call_id: callId,
        offer,
      });
    }
  }

  sendAnswer(callId: string, answer: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice-answer', {
        call_id: callId,
        answer,
      });
    }
  }

  sendIceCandidate(callId: string, candidate: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ice-candidate', {
        call_id: callId,
        candidate,
      });
    }
  }
}

export const websocketService = new WebSocketService();
