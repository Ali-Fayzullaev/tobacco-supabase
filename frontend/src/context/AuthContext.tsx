'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
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

  // Стабилизация: запоминаем текущий user.id чтобы не пересоздавать объект user
  // при TOKEN_REFRESHED (тот же пользователь, просто обновился токен)
  const userIdRef = useRef<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const loadProfile = useCallback(async (userId: string) => {
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
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (userIdRef.current) {
      const p = await loadProfile(userIdRef.current);
      setProfile(p);
    }
  }, [loadProfile]);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!userIdRef.current) return { success: false, error: 'Не авторизован' };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userIdRef.current);
      
      if (error) return { success: false, error: error.message };
      
      await refreshProfile();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, [supabase, refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    userIdRef.current = null;
    setUser(null);
    setProfile(null);
    setSession(null);
    window.location.href = '/login';
  }, [supabase]);

  // Единая подписка на авторизацию
  useEffect(() => {
    let cancelled = false;

    // Гарантированный таймаут — если auth не ответит за 5 сек, всё равно убираем загрузку
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (cancelled) return;

        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
          // Обновляем сессию всегда (новый токен)
          setSession(newSession);

          // Обновляем user ТОЛЬКО если сменился пользователь (другой id)
          // При TOKEN_REFRESHED тот же user — не пересоздаём объект,
          // чтобы не вызывать каскадную перезагрузку корзины/избранного
          const newUserId = newSession.user.id;
          if (userIdRef.current !== newUserId) {
            userIdRef.current = newUserId;
            setUser(newSession.user);
            
            // Профиль загружаем только при смене пользователя
            try {
              const p = await loadProfile(newUserId);
              if (!cancelled) setProfile(p);
            } catch {
              // Профиль не загрузился — не критично
            }
          }
          
          // Убираем загрузку при INITIAL_SESSION
          if (event === 'INITIAL_SESSION') {
            if (!cancelled) setIsLoading(false);
            clearTimeout(timeout);
          }
        } else if (event === 'INITIAL_SESSION') {
          // Нет сессии при загрузке
          userIdRef.current = null;
          if (!cancelled) setIsLoading(false);
          clearTimeout(timeout);
        } else if (event === 'SIGNED_OUT') {
          userIdRef.current = null;
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
  }, [supabase, loadProfile]);

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
