'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Profile } from '@/lib/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate: string;
}

interface SignInData {
  email: string;
  password: string;
}

export function useAuth() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAdmin: false,
    isAuthenticated: false,
  });

  // Загрузка профиля пользователя
  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }

    return data as Profile;
  }, [supabase]);

  // Инициализация auth state
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setState({
          user: session.user,
          profile,
          session,
          isLoading: false,
          isAdmin: profile?.role === 'admin',
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          isLoading: false,
          isAdmin: false,
          isAuthenticated: false,
        });
      }
    };

    initAuth();

    // Слушаем изменения auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await loadProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            session,
            isLoading: false,
            isAdmin: profile?.role === 'admin',
            isAuthenticated: true,
          });
        } else {
          setState({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAdmin: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  // Регистрация (работает с OTP и без)
  const signUp = async (data: SignUpData) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            birth_date: data.birthDate,
          },
        },
      });

      setState(prev => ({ ...prev, isLoading: false }));

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = 'Этот email уже зарегистрирован. Попробуйте войти.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Неверный формат email';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Пароль должен быть минимум 6 символов';
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = 'Слишком много попыток. Подождите час или отключите подтверждение email в Supabase.';
        }
        return { success: false, error: errorMessage };
      }

      // Проверяем нужно ли подтверждение email
      // Если session есть - значит подтверждение отключено, сразу вошли
      if (authData.session) {
        return { 
          success: true, 
          data: authData,
          needsEmailConfirmation: false
        };
      }

      // Если session нет - нужно подтвердить email
      return { 
        success: true, 
        data: authData,
        needsEmailConfirmation: true
      };
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Ошибка сети. Попробуйте позже.' };
    }
  };

  // Подтверждение OTP кода
  const verifyOtp = async (email: string, token: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      setState(prev => ({ ...prev, isLoading: false }));

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
          errorMessage = 'Неверный или просроченный код. Попробуйте ещё раз.';
        }
        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Ошибка проверки кода' };
    }
  };

  // Повторная отправка OTP кода
  const resendOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Код отправлен повторно!' };
  };

  // Вход
  const signIn = async (data: SignInData) => {
    setState(prev => ({ ...prev, isLoading: true }));

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    setState(prev => ({ ...prev, isLoading: false }));

    if (error) {
      let errorMessage = error.message;
      // Более понятные сообщения об ошибках
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Неверный email или пароль';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Email не подтверждён. Проверьте почту.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Неверный формат email';
      }
      console.error('Login error:', error.message);
      return { success: false, error: errorMessage };
    }

    return { success: true, data: authData };
  };

  // Выход
  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    const { error } = await supabase.auth.signOut();
    setState(prev => ({ ...prev, isLoading: false }));

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  // Запрос сброса пароля
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  // Установка нового пароля
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  // Обновление профиля
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Перезагружаем профиль
    const profile = await loadProfile(state.user.id);
    setState(prev => ({ ...prev, profile }));

    return { success: true };
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    verifyOtp,
    resendOtp,
    refreshProfile: () => state.user && loadProfile(state.user.id),
  };
}
