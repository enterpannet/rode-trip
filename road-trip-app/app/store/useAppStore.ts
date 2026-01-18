import { create } from 'zustand';
import { User, Room, Message, Location, VoiceCall, VoiceCallState } from '../types';

interface AppStore {
  // State
  user: User | null;
  currentRoom: Room | null;
  rooms: Room[];
  messages: Message[];
  locations: Location[];
  callState: VoiceCallState | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  updateLocation: (location: Location) => void;
  setLocations: (locations: Location[]) => void;
  setCallState: (callState: VoiceCallState | null) => void;
  setIncomingCall: (call: VoiceCall) => void;
  setCallAccepted: (call: VoiceCall) => void;
  setCallRejected: () => void;
  endCall: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  currentRoom: null,
  rooms: [],
  messages: [],
  locations: [],
  callState: null,
  isLoading: false,
  error: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setCurrentRoom: (room) => set({ currentRoom: room, messages: [] }),

  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  updateLocation: (location) =>
    set((state) => {
      const existingIndex = state.locations.findIndex(
        (loc) => loc.user_id === location.user_id && loc.room_id === location.room_id
      );

      if (existingIndex >= 0) {
        const newLocations = [...state.locations];
        newLocations[existingIndex] = location;
        return { locations: newLocations };
      }

      return { locations: [...state.locations, location] };
    }),

  setLocations: (locations) => set({ locations }),

  setCallState: (callState) => set({ callState }),

  setIncomingCall: (call) =>
    set({
      callState: {
        call,
        isIncoming: true,
        isActive: false,
        callDuration: 0,
      },
    }),

  setCallAccepted: (call) =>
    set((state) => ({
      callState: state.callState
        ? {
            ...state.callState,
            call,
            isIncoming: false,
            isActive: true,
          }
        : {
            call,
            isIncoming: false,
            isActive: true,
            callDuration: 0,
          },
    })),

  setCallRejected: () =>
    set({
      callState: null,
    }),

  endCall: () =>
    set({
      callState: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
