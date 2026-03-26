'use client';

import { useEffect } from 'react';

/**
 * Временный диагностический компонент.
 * УДАЛИТЬ после диагностики.
 */
export function ClientDiag() {
  useEffect(() => {
    // Шаг 1: сразу отправляем базовые данные о куках (без зависимостей)
    const sendBasicDiag = () => {
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
        
        const basic = {
          step: 'basic',
          ts: new Date().toISOString(),
          origin: window.location.origin,
          pathname: window.location.pathname,
          protocol: window.location.protocol,
          cookieRawLength: allCookies.length,
          cookieCount: cookieNames.length,
          cookieNames,
          sbCookieCount: sbCookies.length,
          sbCookies,
          ua: navigator.userAgent.substring(0, 80),
        };
        
        console.log('[ClientDiag-basic]', basic);
        
        // Используем navigator.sendBeacon для надёжной доставки
        const blob = new Blob([JSON.stringify(basic)], { type: 'application/json' });
        navigator.sendBeacon('/api/debug-auth', blob);
      } catch (e: any) {
        try {
          const blob = new Blob([JSON.stringify({ step: 'basic-error', error: e.message, origin: window.location.origin })], { type: 'application/json' });
          navigator.sendBeacon('/api/debug-auth', blob);
        } catch {}
      }
    };

    // Шаг 2: через 500ms проверяем auth
    const sendAuthDiag = async () => {
      const startMs = Date.now();
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase');
        const supabase = getSupabaseBrowserClient();
        
        // Устанавливаем таймаут 5 сек на getSession
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession TIMEOUT after 5s')), 5000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        const elapsedMs = Date.now() - startMs;
        const session = result?.data?.session;
        const error = result?.error;
        
        const auth = {
          step: 'auth',
          ts: new Date().toISOString(),
          origin: window.location.origin,
          elapsedMs,
          sessionUserId: session?.user?.id?.substring(0, 8) || null,
          sessionError: error?.message || null,
          hasAccessToken: !!session?.access_token,
          hasRefreshToken: !!session?.refresh_token,
          tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        };
        
        console.log('[ClientDiag-auth]', auth);
        
        // sendBeacon вместо fetch для надёжности
        const blob = new Blob([JSON.stringify(auth)], { type: 'application/json' });
        navigator.sendBeacon('/api/debug-auth', blob);
      } catch (e: any) {
        const elapsedMs = Date.now() - startMs;
        console.error('[ClientDiag-auth] Error:', e);
        try {
          const blob = new Blob([JSON.stringify({ 
            step: 'auth-error', 
            error: e.message, 
            stack: e.stack?.substring(0, 300), 
            origin: window.location.origin,
            elapsedMs 
          })], { type: 'application/json' });
          navigator.sendBeacon('/api/debug-auth', blob);
        } catch {}
      }
    };

    // Отправляем базовую диагностику немедленно
    sendBasicDiag();
    
    // Отправляем auth диагностику через 500ms (вместо 3 сек)
    const timer = setTimeout(sendAuthDiag, 500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

