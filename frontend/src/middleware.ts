import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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

  const { pathname } = request.nextUrl;

  // Публичные роуты - не требуют авторизации
  const publicRoutes = ['/login', '/register', '/verify-email', '/auth', '/catalog', '/product', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) || pathname === '/';

  // Получаем пользователя один раз (getUser валидирует токен на сервере, надёжнее getSession)
  const { data: { user } } = await supabase.auth.getUser();

  // Если залогиненный пользователь заходит на /login или /register — редиректим
  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/catalog';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return response;
  }
  
  if (isPublicRoute) {
    return response;
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/cart', '/checkout', '/profile', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Для защищённых роутов проверяем авторизацию
  if (isProtectedRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Admin route protection
    if (pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
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
