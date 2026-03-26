import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // Определяем типы маршрутов
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(pathname);
  const protectedRoutes = ['/cart', '/checkout', '/profile', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Supabase SSR клиент создаётся ВСЕГДА — он обновляет auth-куки
  // (обновление JWT-токенов передаётся через cookies).
  // Без этого токен в куке протухнет и клиентский JS не восстановит сессию.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) {
          // DEBUG: логируем опции кук
          cookiesToSet.forEach(({ name, options }) => {
            if (name.startsWith('sb-')) {
              console.log(`[MW-COOKIE] setAll: ${name} | httpOnly=${options?.httpOnly} secure=${options?.secure} sameSite=${options?.sameSite} path=${options?.path} maxAge=${options?.maxAge}`);
            }
          });
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Хелпер: создаёт redirect-ответ с сохранением обновлённых auth cookies
  const redirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // getUser() обновляет сессию/куки и проверяет авторизацию.
  // Для ВСЕХ страниц вызываем getUser() чтобы обновить JWT в куке —
  // иначе при переходе на публичные страницы (каталог) куки протухнут
  // и клиентский JS потеряет авторизацию.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Сеть упала — для защищённых маршрутов редиректим на login,
    // для остальных просто пропускаем (пусть клиент разберётся)
    if (isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return redirectWithCookies(redirectUrl);
    }
    return response;
  }

  // --- DEBUG: диагностика cookie/auth в заголовке ответа ---
  const allCookies = request.cookies.getAll();
  const sbCookies = allCookies.filter(c => c.name.startsWith('sb-'));
  const cookieDetails = sbCookies.map(c => `${c.name}(${c.value.length}ch)`).join(', ');
  response.headers.set('x-debug-auth', JSON.stringify({
    user: user ? user.id.substring(0, 8) : null,
    cookies: allCookies.length,
    sbCookies: sbCookies.length,
    sbDetails: cookieDetails || 'none',
    proto: request.headers.get('x-forwarded-proto') || 'unknown',
  }));

  // Логируем в консоль сервера для SSH диагностики
  if (pathname === '/catalog' || pathname === '/api/debug-auth') {
    console.log(`[MW] ${pathname} | proto=${request.headers.get('x-forwarded-proto')} | user=${user?.id?.substring(0, 8) || 'anon'} | cookies=${allCookies.length} sb=${sbCookies.length} | ${cookieDetails || 'no sb cookies'}`);
    
    // Проверяем Set-Cookie заголовки в ответе
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((sc: string) => {
        // Логируем только атрибуты (без значения) для безопасности
        const parts = sc.split(';').map((p: string) => p.trim());
        const nameVal = parts[0]?.split('=');
        const name = nameVal?.[0] || 'unknown';
        const attrs = parts.slice(1).join('; ');
        console.log(`[MW-SET-COOKIE] ${name} | attrs: ${attrs}`);
      });
    }
  }
  // --- END DEBUG ---

  // Для публичных страниц — просто возвращаем response с обновлёнными cookies
  if (!isAuthPage && !isProtectedRoute) {
    return response;
  }

  // Если залогиненный пользователь заходит на /login или /register — редиректим
  if (isAuthPage) {
    if (user) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/catalog';
      return redirectWithCookies(new URL(redirectTo, request.url));
    }
    return response;
  }

  // Защищённые маршруты — требуют авторизации
  if (isProtectedRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return redirectWithCookies(redirectUrl);
    }

    // Admin route protection
    if (pathname.startsWith('/admin')) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          return redirectWithCookies(new URL('/', request.url));
        }
      } catch {
        // Если не удалось проверить роль — не пускаем
        return redirectWithCookies(new URL('/', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
