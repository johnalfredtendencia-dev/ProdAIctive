// constants/api.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_GOOGLE_LOGIN: '/auth/google-login',
  AUTH_PROFILE: '/auth/profile',

  // Tasks
  TASKS_LIST: '/tasks',
  TASKS_CREATE: '/tasks',
  TASKS_UPDATE: (id: string) => `/tasks/${id}`,
  TASKS_DELETE: (id: string) => `/tasks/${id}`,

  // Focus
  FOCUS_CREATE_SESSION: '/focus/session',
  FOCUS_SESSIONS: '/focus/sessions',
  FOCUS_STATISTICS: '/focus/statistics',

  // Chat
  CHAT_SESSION: '/chat/session',
  CHAT_SESSIONS: '/chat/sessions',
  CHAT_MESSAGE: '/chat/message',
  CHAT_DELETE_SESSION: (id: string) => `/chat/session/${id}`,
};
