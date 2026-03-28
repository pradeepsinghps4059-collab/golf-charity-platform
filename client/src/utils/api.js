import axios from 'axios';
import { navigateToLogin, tokenStorage } from './tokenStorage';
import { isSupabaseConfigured, supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (!isSupabaseConfigured || !supabase) {
    const token = tokenStorage.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  return supabase.auth.getSession().then(({ data }) => {
    const token = data.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signOut().catch(() => {});
      }
      navigateToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;
