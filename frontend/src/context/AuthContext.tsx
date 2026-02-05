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

  // Только один раз при загрузке - без подписок!
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        
        if (cancelled) return;
        
        if (s?.user) {
          setSession(s);
          setUser(s.user);
          const p = await loadProfile(s.user.id);
          if (!cancelled) setProfile(p);
        }
      } catch (e) {
        console.log('Auth init error:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
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
