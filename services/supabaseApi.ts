// services/supabaseApi.ts
// Alternative API service using Supabase instead of custom backend
// Uncomment this to switch from custom backend to Supabase

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ubndjsgzpkgtusevrksf.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibmRqc2d6cGtndHVzZXZya3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMDQ3MzksImV4cCI6MjA4MzY4MDczOX0.axlZe8P4Bsurp_MkK35ZplvOUwSkftDQymqwy-2QrsQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth API - Using Supabase Auth
export const authAPI = {
  register: async (fullName: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Save token
      if (data.session?.access_token) {
        await SecureStore.setItemAsync('authToken', data.session.access_token);
      }

      return {
        success: true,
        token: data.session?.access_token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          fullName: fullName,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Save token
      if (data.session?.access_token) {
        await SecureStore.setItemAsync('authToken', data.session.access_token);
      }

      return {
        success: true,
        token: data.session?.access_token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  googleLogin: async (googleToken: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleToken,
      });

      if (error) throw error;

      if (data.session?.access_token) {
        await SecureStore.setItemAsync('authToken', data.session.access_token);
      }

      return {
        success: true,
        token: data.session?.access_token,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  getProfile: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) throw error;

      return {
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  saveToken: async (token: string) => {
    await SecureStore.setItemAsync('authToken', token);
  },

  getToken: async () => {
    return await SecureStore.getItemAsync('authToken');
  },

  clearToken: async () => {
    await SecureStore.deleteItemAsync('authToken');
    await supabase.auth.signOut();
  },
};

// Task API - Using Supabase Database
export const taskAPI = {
  getTasks: async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        tasks: data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  createTask: async (taskData: any) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            ...taskData,
            users_id: userData.user?.id,
          },
        ])
        .select();

      if (error) throw error;

      return {
        success: true,
        task: data?.[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  updateTask: async (taskId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select();

      if (error) throw error;

      return {
        success: true,
        task: data?.[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};

// Focus API - Using Supabase Database
export const focusAPI = {
  createSession: async (sessionData: any) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert([
          {
            ...sessionData,
            users_id: userData.user?.id,
          },
        ])
        .select();

      if (error) throw error;

      return {
        success: true,
        session: data?.[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  getSessions: async () => {
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        sessions: data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  getStatistics: async () => {
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('duration, break_duration, sessions_completed');

      if (error) throw error;

      const sessions = data || [];
      const statistics = {
        totalSessions: sessions.length,
        totalFocusTime: sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0),
        totalBreakTime: sessions.reduce((sum: number, s: any) => sum + (s.break_duration || 0), 0),
        totalPomodoros: sessions.reduce((sum: number, s: any) => sum + (s.sessions_completed || 0), 0),
        averageSessionDuration: sessions.length > 0
          ? sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) / sessions.length
          : 0,
      };

      return {
        success: true,
        statistics,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};

// Chat API - Using Supabase Database
export const chatAPI = {
  getOrCreateSession: async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      // Try to get existing session
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('users_id', userData.user?.id)
        .limit(1);

      if (sessions && sessions.length > 0) {
        return {
          success: true,
          session: sessions[0],
        };
      }

      // Create new session
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([
          {
            users_id: userData.user?.id,
            title: 'Chat Session',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        session: data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  getSessions: async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        sessions: data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  addMessage: async (sessionId: string, text: string, sender: 'user' | 'bot') => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: sessionId,
            text,
            sender,
          },
        ])
        .select();

      if (error) throw error;

      return {
        success: true,
        message: data?.[0],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  getMessages: async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        messages: data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};

export default supabase;
