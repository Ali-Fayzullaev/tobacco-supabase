'use client';

import { useEffect } from 'react';

/**
 * Временный диагностический компонент.
 * При загрузке страницы отправляет на /api/debug-auth (POST)
 * информацию о document.cookie и localStorage — чтобы понять,
 * видит ли клиентский JS auth-куки на HTTPS.
 * УДАЛИТЬ после диагностики.
 */
export function ClientDiag() {
  useEffect(() => {
    const run = async () => {
      try {
        const allCookies = document.cookie;
        const cookieNames = allCookies
          ? allCookies.split(';').map(c => {
              const name = c.trim().split('=')[0];
              const val = c.trim().split('=').slice(1).join('=');
              return `${name}(${val.length}ch)`;
            })
          : [];
        
        const sbCookies = cookieNames.filter(c => c.startsWith('sb-'));
        
        // Попробуем получить сессию через createBrowserClient
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        const diag = {
          ts: new Date().toISOString(),
          origin: window.location.origin,
          pathname: window.location.pathname,
          cookieRaw: allCookies.length,
          cookieNames,
          sbCookies,
          sessionUserId: session?.user?.id?.substring(0, 8) || null,
          sessionError: error?.message || null,
          hasAccessToken: !!session?.access_token,
          hasRefreshToken: !!session?.refresh_token,
        };
        
        console.log('[ClientDiag]', diag);
        
        // Отправляем на сервер для логирования
        await fetch('/api/debug-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diag),
        });
      } catch (e) {
        console.error('[ClientDiag] Error:', e);
      }
    };
    
    // Небольшая задержка чтобы auth успел инициализироваться
    const timer = setTimeout(run, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
