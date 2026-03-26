import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── ЕДИНСТВЕННЫЙ браузерный клиент (синглтон) ───
// ВАЖНО: в браузере допустим только ОДИН GoTrueClient,
// иначе два экземпляра конкурируют за один storage key
// и перезаписывают друг другу auth-токен → RLS-ошибки.
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

// ─── Публичный клиент для товаров/категорий (без авторизации) ───
// Отдельный клиент для публичных данных: НЕ отправляет JWT-токен,
// НЕ пытается обновить сессию, НЕ конфликтует с основным GoTrueClient
// (persistSession: false → не трогает localStorage/cookies).
// Без этого при протухшем токене запрос продуктов зависает.
let publicClient: SupabaseClient | null = null;

export const getPublicSupabaseClient = () => {
  if (!publicClient) {
    publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return publicClient;
};

// Алиасы для совместимости
export const createBrowserSupabaseClient = getSupabaseBrowserClient;
export const createServerSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey);

