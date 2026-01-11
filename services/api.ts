// services/api.ts
import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (fullName: string, email: string, password: string) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, {
      fullName,
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, {
      email,
      password,
    });
    return response.data;
  },

  googleLogin: async (googleToken: string) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_GOOGLE_LOGIN, {
      googleToken,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get(API_ENDPOINTS.AUTH_PROFILE);
    return response.data;
  },

  saveToken: async (token: string) => {
    await SecureStore.setItemAsync('authToken', token);
  },

  getToken: async () => {
    return await SecureStore.getItemAsync('authToken');
  },

  clearToken: async () => {
    await SecureStore.deleteItemAsync('authToken');
  },
};

// Task API
export const taskAPI = {
  getTasks: async () => {
    const response = await apiClient.get(API_ENDPOINTS.TASKS_LIST);
    return response.data;
  },

  createTask: async (taskData: any) => {
    const response = await apiClient.post(API_ENDPOINTS.TASKS_CREATE, taskData);
    return response.data;
  },

  updateTask: async (taskId: string, updates: any) => {
    const response = await apiClient.put(API_ENDPOINTS.TASKS_UPDATE(taskId), updates);
    return response.data;
  },

  deleteTask: async (taskId: string) => {
    const response = await apiClient.delete(API_ENDPOINTS.TASKS_DELETE(taskId));
    return response.data;
  },
};

// Focus API
export const focusAPI = {
  createSession: async (sessionData: any) => {
    const response = await apiClient.post(API_ENDPOINTS.FOCUS_CREATE_SESSION, sessionData);
    return response.data;
  },

  getSessions: async () => {
    const response = await apiClient.get(API_ENDPOINTS.FOCUS_SESSIONS);
    return response.data;
  },

  getStatistics: async () => {
    const response = await apiClient.get(API_ENDPOINTS.FOCUS_STATISTICS);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  getOrCreateSession: async () => {
    const response = await apiClient.get(API_ENDPOINTS.CHAT_SESSION);
    return response.data;
  },

  getSessions: async () => {
    const response = await apiClient.get(API_ENDPOINTS.CHAT_SESSIONS);
    return response.data;
  },

  addMessage: async (text: string, sender: 'user' | 'bot') => {
    const response = await apiClient.post(API_ENDPOINTS.CHAT_MESSAGE, {
      text,
      sender,
    });
    return response.data;
  },

  deleteSession: async (sessionId: string) => {
    const response = await apiClient.delete(API_ENDPOINTS.CHAT_DELETE_SESSION(sessionId));
    return response.data;
  },
};

export default apiClient;
