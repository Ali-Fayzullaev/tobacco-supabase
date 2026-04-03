import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;
  const noIndexPrefixes = ['/login', '/register', '/cart', '/checkout', '/profile', '/admin', '/debug-auth', '/auth', '/verify-email', '/order-success'];
  const shouldNoIndex = noIndexPrefixes.some(prefix => pathname.startsWith(prefix));

  if (shouldNoIndex) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

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
