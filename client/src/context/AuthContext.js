import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { tokenStorage } from '../utils/tokenStorage';
import { isSupabaseConfigured, supabase } from '../utils/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const bootstrapSupabaseProfile = useCallback(async (sessionUser) => {
    const fallbackName = sessionUser?.user_metadata?.name || sessionUser?.email?.split('@')[0] || 'User';
    const { data } = await api.post('/auth/bootstrap-profile', {
      name: fallbackName,
      charity_percentage: 10,
      country_code: 'IN',
      locale: 'en-IN',
      timezone: 'Asia/Kolkata',
      preferred_currency: 'INR',
    });
    return data.user;
  }, []);

  const loadUser = useCallback(async () => {
    let sessionUser = null;
    if (isSupabaseConfigured && supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }
      sessionUser = sessionData.session.user;
    } else {
      const token = tokenStorage.get();
      if (!token) {
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      if (isSupabaseConfigured && supabase && sessionUser) {
        try {
          const bootstrappedUser = await bootstrapSupabaseProfile(sessionUser);
          setUser(bootstrappedUser);
          return;
        } catch (bootstrapError) {
          console.error('Profile bootstrap failed:', bootstrapError);
        }
      }

      setUser(null);
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      tokenStorage.clear();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [bootstrapSupabaseProfile]);

  useEffect(() => {
    loadUser();

    if (!isSupabaseConfigured || !supabase) return undefined;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }
      setLoading(false);
      setTimeout(() => {
        loadUser();
      }, 0);
    });

    return () => authListener.subscription.unsubscribe();
  }, [loadUser]);

  const login = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const authUser = authData.user;
      const optimisticUser = {
        id: authUser?.id,
        _id: authUser?.id,
        email: authUser?.email,
        name: authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User',
        role: 'user',
      };
      setUser(optimisticUser);

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        return data.user;
      } catch {
        try {
          const bootstrappedUser = await bootstrapSupabaseProfile(authUser);
          setUser(bootstrappedUser);
          return bootstrappedUser;
        } catch {
          return optimisticUser;
        }
      }
    }

    const { data } = await api.post('/auth/login', { email, password });
    tokenStorage.set(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    if (isSupabaseConfigured && supabase) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            name: payload.name,
          },
        },
      });

      if (error) throw error;

      if (!authData.session) {
        throw new Error('Signup succeeded. Please disable email confirmation or confirm the email before continuing.');
      }

      const { data } = await api.post('/auth/bootstrap-profile', {
        name: payload.name,
        charity_id: payload.charity_id,
        charity_percentage: payload.charity_percentage,
        country_code: payload.country_code || 'IN',
        locale: payload.locale || 'en-IN',
        timezone: payload.timezone || 'Asia/Kolkata',
        preferred_currency: payload.preferred_currency || 'INR',
      });

      setUser(data.user);
      return data.user;
    }

    const { data } = await api.post('/auth/register', payload);
    tokenStorage.set(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    tokenStorage.clear();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialized, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
