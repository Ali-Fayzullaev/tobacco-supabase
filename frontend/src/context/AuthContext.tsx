'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Profile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getSupabaseBrowserClient();

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return data as Profile | null;
    } catch {
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await loadProfile(user.id);
      setProfile(p);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { success: false, error: 'Не авторизован' };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) return { success: false, error: error.message };
      
      await refreshProfile();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    window.location.href = '/login';
  };

  // Единая подписка на авторизацию
  useEffect(() => {
    let cancelled = false;

    // Гарантированный таймаут — если auth не ответит за 5 сек, всё равно убираем загрузку
    const timeout = setTimeout(() => {
      if (!cancelled) {
        // Auth timeout — forcing isLoading=false
        setIsLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (cancelled) return;

        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Загружаем профиль, но НЕ блокируем isLoading
          if (event === 'INITIAL_SESSION') {
            if (!cancelled) setIsLoading(false);
            clearTimeout(timeout);
          }
          
          // Профиль загружаем в фоне
          const p = await loadProfile(newSession.user.id);
          if (!cancelled) setProfile(p);
        } else if (event === 'INITIAL_SESSION' && !newSession) {
          // Нет сессии при загрузке
          if (!cancelled) setIsLoading(false);
          clearTimeout(timeout);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin: profile?.role === 'admin', 
        isAuthenticated: !!session,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isAdmin: false,
      isAuthenticated: false,
      signOut: async () => {},
      refreshProfile: async () => {},
      updateProfile: async () => ({ success: false, error: 'No context' }),
    };
  }
  return context;
}
