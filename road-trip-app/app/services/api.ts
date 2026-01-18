import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Log API URL for debugging
console.log('[ApiService] 📡 API URL configured:', API_URL);
console.log('[ApiService] 📡 Full base URL:', `${API_URL}/api`);
console.log('[ApiService] 📡 Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
console.log('[ApiService] 📡 process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

class ApiService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api`;
    console.log('[ApiService] 🔧 Creating Axios client with baseURL:', baseURL);
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      withCredentials: true, // Important for HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log('[ApiService] 📤 Request:', config.method?.toUpperCase(), config.url, config.baseURL);
        return config;
      },
      (error) => {
        console.error('[ApiService] ❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log('[ApiService] ✅ Response:', response.status, response.config.url);
        return response;
      },
      async (error: AxiosError) => {
        if (error.code === 'ECONNREFUSED') {
          console.error('[ApiService] ❌ Connection refused - Backend may not be running');
          console.error('[ApiService] ❌ Tried to connect to:', error.config?.baseURL || error.config?.url);
        } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
          console.error('[ApiService] ❌ Network error - Check your internet connection');
        } else if (error.response?.status === 401) {
          console.log('[ApiService] ⚠️ Unauthorized (401)');
          // Handle unauthorized - clear user state
          // This will be handled by the store
        } else {
          console.error('[ApiService] ❌ Response error:', error.response?.status, error.message, error.config?.url);
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(name: string, email: string, password: string) {
    console.log('[ApiService] 📝 Registering user:', email);
    try {
      const response = await this.client.post('/auth/register', {
        name,
        email,
        password,
      });
      console.log('[ApiService] ✅ Registration successful');
      return response.data;
    } catch (error: any) {
      console.error('[ApiService] ❌ Registration failed:', error?.message);
      throw error;
    }
  }

  async login(email: string, password: string) {
    console.log('[ApiService] 🔐 Logging in user:', email);
    try {
      const response = await this.client.post('/auth/login', {
        email,
        password,
      });
      console.log('[ApiService] ✅ Login successful');
      return response.data;
    } catch (error: any) {
      console.error('[ApiService] ❌ Login failed:', error?.message);
      throw error;
    }
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser() {
    console.log('[ApiService] 👤 Getting current user...');
    try {
      const response = await this.client.get('/auth/me');
      console.log('[ApiService] ✅ Got current user');
      return response.data;
    } catch (error: any) {
      console.error('[ApiService] ❌ Failed to get current user:', error?.message);
      throw error;
    }
  }

  async getSessionToken(): Promise<string> {
    console.log('[ApiService] 🔑 Getting session token...');
    try {
      const response = await this.client.get('/auth/session-token');
      console.log('[ApiService] ✅ Got session token');
      return response.data.token;
    } catch (error: any) {
      console.error('[ApiService] ❌ Failed to get session token:', error?.message);
      throw error;
    }
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

  async updateRoom(roomId: string, name?: string, description?: string) {
    const response = await this.client.put(`/rooms/${roomId}`, {
      name,
      description,
    });
    return response.data;
  }

  async deleteRoom(roomId: string) {
    const response = await this.client.delete(`/rooms/${roomId}`);
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

  // Health check to test backend connectivity
  async healthCheck() {
    console.log('[ApiService] 🏥 Checking backend health...');
    try {
      const response = await this.client.get('/health');
      console.log('[ApiService] ✅ Backend is healthy:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ApiService] ❌ Backend health check failed:', error?.message);
      throw error;
    }
  }
}

export const apiService = new ApiService();
