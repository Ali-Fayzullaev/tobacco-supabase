import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Клиент с авторизацией (для корзины, профиля, заказов) ───
// Синглтон — ОДИН экземпляр на всё приложение
let browserClient: SupabaseClient | null = null;

export const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
};

// ─── Анонимный клиент для ПУБЛИЧНЫХ данных (товары, категории) ───
// Не использует cookie/сессию → запросы никогда не блокируются авторизацией
let publicClient: SupabaseClient | null = null;

export const getPublicSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (!publicClient) {
    publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return publicClient;
};

// Алиасы для совместимости
export const createBrowserSupabaseClient = getSupabaseBrowserClient;
export const createServerSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey);

