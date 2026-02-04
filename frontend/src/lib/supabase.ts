import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Синглтон для клиентского браузера - ОДИН экземпляр на всё приложение
let browserClient: SupabaseClient | null = null;

export const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    // На сервере всегда создаём новый
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
};

// Алиасы для совместимости
export const createBrowserSupabaseClient = getSupabaseBrowserClient;
export const createServerSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey);
