import { isSupabaseConfigured, supabase } from './supabase';

const TOKEN_KEY = 'gc_token';

const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const tokenStorage = {
  get() {
    if (isSupabaseConfigured && supabase) {
      return null;
    }
    return hasBrowserStorage() ? window.localStorage.getItem(TOKEN_KEY) : null;
  },
  set(token) {
    if (isSupabaseConfigured && supabase) {
      return;
    }
    if (hasBrowserStorage()) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
  },
  clear() {
    if (isSupabaseConfigured && supabase) {
      return;
    }
    if (hasBrowserStorage()) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem('gc_user');
    }
  },
};

export const navigateToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};
