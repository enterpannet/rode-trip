export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  text?: string;
  image_url?: string;
  message_type: 'text' | 'image';
  created_at: string;
}

export interface Location {
  id: string;
  user_id: string;
  room_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface VoiceCall {
  id: string;
  room_id: string;
  initiator_id: string;
  start_time: string;
  end_time?: string;
  status: 'ringing' | 'active' | 'ended';
}

export interface VoiceCallState {
  call: VoiceCall | null;
  isIncoming: boolean;
  isActive: boolean;
  callDuration: number;
}

export interface AppState {
  user: User | null;
  currentRoom: Room | null;
  rooms: Room[];
  messages: Message[];
  locations: Location[];
  callState: VoiceCallState | null;
  isLoading: boolean;
  error: string | null;
}
