import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 10000,
      withCredentials: true, // Important for HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear user state
          // This will be handled by the store
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(name: string, email: string, password: string) {
    const response = await this.client.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Room endpoints
  async createRoom(name: string, description?: string) {
    const response = await this.client.post('/rooms', {
      name,
      description,
    });
    return response.data;
  }

  async getRooms() {
    const response = await this.client.get('/rooms');
    return response.data;
  }

  async joinRoom(roomId: string) {
    const response = await this.client.post('/rooms/join', {
      room_id: roomId,
    });
    return response.data;
  }

  async getRoomMembers(roomId: string) {
    const response = await this.client.get(`/rooms/${roomId}/members`);
    return response.data;
  }

  // Message endpoints
  async getMessages(roomId: string, page: number = 0, pageSize: number = 20) {
    const response = await this.client.get(`/rooms/${roomId}/messages`, {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  }

  async sendMessage(roomId: string, text?: string, imageUrl?: string, messageType: 'text' | 'image' = 'text') {
    const response = await this.client.post(`/rooms/${roomId}/messages`, {
      text,
      image_url: imageUrl,
      message_type: messageType,
    });
    return response.data;
  }

  // Location endpoints
  async updateLocation(roomId: string, latitude: number, longitude: number) {
    const response = await this.client.post(`/rooms/${roomId}/location`, {
      latitude,
      longitude,
    });
    return response.data;
  }

  async getLocations(roomId: string) {
    const response = await this.client.get(`/rooms/${roomId}/locations`);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
