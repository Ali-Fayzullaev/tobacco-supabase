'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { getSupabaseBrowserClient, getPublicSupabaseClient } from '@/lib/supabase';

export default function DebugAuthPage() {
  const { user, profile, session, isLoading, isAdmin, isAuthenticated } = useAuth();
  const [cookies, setCookies] = useState<string[]>([]);
  const [sessionCheck, setSessionCheck] = useState<any>(null);
  const [userCheck, setUserCheck] = useState<any>(null);
  const [profileCheck, setProfileCheck] = useState<any>(null);
  const [publicCheck, setPublicCheck] = useState<any>(null);
  const [cartCheck, setCartCheck] = useState<any>(null);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  useEffect(() => {
    // Показываем имена cookies (не значения)
    const cookieStr = document.cookie;
    const parsed = cookieStr.split(';').map(c => {
      const [name, val] = c.trim().split('=');
      return { name, valueLength: val?.length || 0 };
    }).filter(c => c.name);
    setCookies(parsed.map(c => `${c.name} (${c.valueLength} chars)`));
  }, []);

  const runDiagnostics = async () => {
    const supabase = getSupabaseBrowserClient();
    const publicSupabase = getPublicSupabaseClient();

    // 1. Check getSession
    try {
      const { data, error } = await supabase.auth.getSession();
      setSessionCheck({
        hasSession: !!data.session,
        accessTokenLength: data.session?.access_token?.length || 0,
        refreshTokenLength: data.session?.refresh_token?.length || 0,
        expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
        expiresIn: data.session?.expires_at ? Math.round(data.session.expires_at - Date.now() / 1000) + 's' : null,
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
        error: error?.message || null,
      });
    } catch (e: any) {
      setSessionCheck({ error: e.message });
    }

    // 2. Check getUser
    try {
      const { data, error } = await supabase.auth.getUser();
      setUserCheck({
        hasUser: !!data.user,
        userId: data.user?.id,
        email: data.user?.email,
        error: error?.message || null,
      });
    } catch (e: any) {
      setUserCheck({ error: e.message });
    }

    // 3. Check profile query
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .eq('id', user.id)
          .single();
        setProfileCheck({ data, error: error?.message || null });
      } catch (e: any) {
        setProfileCheck({ error: e.message });
      }
    } else {
      setProfileCheck({ note: 'No user ID available' });
    }

    // 4. Public client check (products)
    try {
      const { data, error } = await publicSupabase
        .from('products')
        .select('id, name')
        .limit(1);
      setPublicCheck({ data, error: error?.message || null });
    } catch (e: any) {
      setPublicCheck({ error: e.message });
    }

    // 5. Cart items check
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id);
        setCartCheck({ count: data?.length || 0, data, error: error?.message || null });
      } catch (e: any) {
        setCartCheck({ error: e.message });
      }
    }
  };

  const tryRefresh = async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase.auth.refreshSession();
      setRefreshResult({
        success: !!data.session,
        newExpiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
        error: error?.message || null,
      });
    } catch (e: any) {
      setRefreshResult({ error: e.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <h1 className="text-2xl font-bold mb-6 text-gold-500">🔍 Auth Debug</h1>
      
      <div className="space-y-6 max-w-3xl">
        {/* AuthContext State */}
        <section className="bg-[#1E1E1E] rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-gold-400">AuthContext</h2>
          <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{JSON.stringify({
  isLoading,
  isAuthenticated,
  isAdmin,
  hasUser: !!user,
  userId: user?.id,
  email: user?.email,
  hasProfile: !!profile,
  profileName: profile?.first_name,
  profileRole: profile?.role,
  hasSession: !!session,
}, null, 2)}
          </pre>
        </section>

        {/* Cookies */}
        <section className="bg-[#1E1E1E] rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-gold-400">Cookies ({cookies.length})</h2>
          <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{cookies.join('\n') || 'No cookies'}
          </pre>
        </section>

        {/* Browser Info */}
        <section className="bg-[#1E1E1E] rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-gold-400">Browser Info</h2>
          <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{JSON.stringify({
  url: typeof window !== 'undefined' ? window.location.href : '',
  protocol: typeof window !== 'undefined' ? window.location.protocol : '',
  hostname: typeof window !== 'undefined' ? window.location.hostname : '',
  cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : null,
}, null, 2)}
          </pre>
        </section>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={runDiagnostics}
            className="px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400"
          >
            Run Diagnostics
          </button>
          <button
            onClick={tryRefresh}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500"
          >
            Force Token Refresh
          </button>
        </div>

        {/* Session Check */}
        {sessionCheck && (
          <section className="bg-[#1E1E1E] rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gold-400">getSession()</h2>
            <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{JSON.stringify(sessionCheck, null, 2)}
            </pre>
          </section>
        )}

        {/* User Check */}
        {userCheck && (
          <section className="bg-[#1E1E1E] rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gold-400">getUser()</h2>
            <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{JSON.stringify(userCheck, null, 2)}
            </pre>
          </section>
        )}

        {/* Profile Check */}
        {profileCheck && (
          <section className="bg-[#1E1E1E] rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gold-400">Profile Query</h2>
            <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{JSON.stringify(profileCheck, null, 2)}
            </pre>
          </section>
        )}

        {/* Public Check */}
        {publicCheck && (
          <section className="bg-[#1E1E1E] rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gold-400">Public Products Query</h2>
            <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{JSON.stringify(publicCheck, null, 2)}
            </pre>
          </section>
        )}

        {/* Cart Check */}
        {cartCheck && (
          <section className="bg-[#1E1E1E] rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gold-400">Cart Items Query</h2>
            <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{JSON.stringify(cartCheck, null, 2)}
            </pre>
          </section>
        )}

        {/* Refresh Result */}
        {refreshResult && (
          <section className="bg-[#1E1E1E] rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gold-400">Token Refresh Result</h2>
            <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
{JSON.stringify(refreshResult, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
