import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // Определяем типы маршрутов ДО создания Supabase клиента
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(pathname);
  const protectedRoutes = ['/cart', '/checkout', '/profile', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Для публичных страниц (каталог, продукт, главная) — НЕ вызываем getUser()
  // Это убирает лишний сетевой запрос и ошибки ERR_CONNECTION_CLOSED
  if (!isAuthPage && !isProtectedRoute) {
    return response;
  }

  // Создаём Supabase клиент только когда нужна проверка авторизации
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

  // getUser() вызывается ТОЛЬКО для auth-страниц и защищённых маршрутов
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Сеть упала — для защищённых маршрутов редиректим на login,
    // для auth-страниц просто пропускаем (пусть клиент разберётся)
    if (isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return redirectWithCookies(redirectUrl);
    }
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
