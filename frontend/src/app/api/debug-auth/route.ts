import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST: принимает клиентскую диагностику и логирует
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[CLIENT-DIAG]', JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const headerStore = await headers();
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
    requestHeaders: {
      host: headerStore.get('host'),
      'x-forwarded-proto': headerStore.get('x-forwarded-proto'),
      'x-forwarded-for': headerStore.get('x-forwarded-for'),
      'x-real-ip': headerStore.get('x-real-ip'),
      cookie: headerStore.get('cookie') ? `[present, length=${headerStore.get('cookie')!.length}]` : '[missing]',
      'user-agent': headerStore.get('user-agent')?.substring(0, 80),
    },
    cookies: cookieInfo,
    cookieCount: allCookies.length,
    supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-')).length,
    auth: authResult,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
