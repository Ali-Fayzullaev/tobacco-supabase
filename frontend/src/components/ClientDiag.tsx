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
        };
        
        console.log('[ClientDiag-basic]', basic);
        
        // Используем navigator.sendBeacon для надёжной доставки
        const blob = new Blob([JSON.stringify(basic)], { type: 'application/json' });
        navigator.sendBeacon('/api/debug-auth', blob);
      } catch (e: any) {
        // Даже если всё сломалось — попробуем отправить ошибку
        try {
          const blob = new Blob([JSON.stringify({ step: 'basic-error', error: e.message, origin: window.location.origin })], { type: 'application/json' });
          navigator.sendBeacon('/api/debug-auth', blob);
        } catch {}
      }
    };

    // Шаг 2: через 3 сек проверяем auth через существующий клиент
    const sendAuthDiag = async () => {
      try {
        // Используем существующий синглтон — НЕ создаём второй GoTrueClient!
        const { getSupabaseBrowserClient } = await import('@/lib/supabase');
        const supabase = getSupabaseBrowserClient();
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        const auth = {
          step: 'auth',
          ts: new Date().toISOString(),
          origin: window.location.origin,
          sessionUserId: session?.user?.id?.substring(0, 8) || null,
          sessionError: error?.message || null,
          hasAccessToken: !!session?.access_token,
          hasRefreshToken: !!session?.refresh_token,
          tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        };
        
        console.log('[ClientDiag-auth]', auth);
        
        await fetch('/api/debug-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auth),
        });
      } catch (e: any) {
        console.error('[ClientDiag-auth] Error:', e);
        try {
          const blob = new Blob([JSON.stringify({ step: 'auth-error', error: e.message, stack: e.stack?.substring(0, 300), origin: window.location.origin })], { type: 'application/json' });
          navigator.sendBeacon('/api/debug-auth', blob);
        } catch {}
      }
    };

    // Отправляем базовую диагностику немедленно
    sendBasicDiag();
    
    // Отправляем auth диагностику через 3 секунды
    const timer = setTimeout(sendAuthDiag, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
