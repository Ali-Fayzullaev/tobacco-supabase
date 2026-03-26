import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Показываем имена и длины куков (НЕ значения — безопасность)
  const cookieInfo = allCookies.map(c => ({
    name: c.name,
    valueLength: c.value.length,
    valuePreview: c.value.substring(0, 20) + '...',
  }));

  // Пробуем создать Supabase клиент и получить пользователя
  let authResult: any = { user: null, error: null };
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // read-only — не пишем куки в диагностике
          },
        },
      }
    );

    const { data, error } = await supabase.auth.getUser();
    authResult = {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
      } : null,
      error: error?.message || null,
    };

    // Проверяем профиль
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('id', data.user.id)
        .single();
      
      authResult.profile = profile;
      authResult.profileError = profileError?.message || null;
    }
  } catch (e: any) {
    authResult.error = e.message;
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    cookies: cookieInfo,
    cookieCount: allCookies.length,
    supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-')).length,
    auth: authResult,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
