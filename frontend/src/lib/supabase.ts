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

// ─── Публичный клиент = тот же browserClient ───
// Для публичных данных (товары, категории) RLS разрешает SELECT всем (is_active = true),
// поэтому отдельный анонимный клиент не нужен. Использование одного клиента
// гарантирует, что не будет конфликта GoTrueClient.
export const getPublicSupabaseClient = getSupabaseBrowserClient;

// Алиасы для совместимости
export const createBrowserSupabaseClient = getSupabaseBrowserClient;
export const createServerSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey);

