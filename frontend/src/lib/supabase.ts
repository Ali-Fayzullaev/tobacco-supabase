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
// НЕ пытается обновить сессию, НЕ конфликтует с основным GoTrueClient.
//
// КРИТИЧНО: storageKey ОБЯЗАТЕЛЬНО должен быть уникальным!
// Иначе два GoTrueClient с одним ключом общаются через BroadcastChannel,
// публичный клиент транслирует "сессии нет" → основной теряет авторизацию.
// Это и было причиной потери auth на production (HTTPS).
//
// global.headers.Authorization фиксирует anon-key → клиент НИКОГДА
// не подставит пользовательский JWT, даже если каким-то образом получит его.
let publicClient: SupabaseClient | null = null;

export const getPublicSupabaseClient = () => {
  if (!publicClient) {
    publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-public-anon-readonly',
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      },
    });
  }
  return publicClient;
};

// Алиасы для совместимости
export const createBrowserSupabaseClient = getSupabaseBrowserClient;
export const createServerSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey);

