import { NextResponse } from 'next/server';

/**
 * Standalone diagnostic page — no React, no bundles, just raw HTML+JS.
 * Checks: cookies, localStorage, fetch, auth session.
 * 
 * УДАЛИТЬ после диагностики!
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Client Diagnostic</title>
<style>
  body { font-family: monospace; background: #111; color: #0f0; padding: 20px; }
  .ok { color: #0f0; }
  .warn { color: #ff0; }
  .err { color: #f00; }
  pre { white-space: pre-wrap; word-break: break-all; background: #222; padding: 10px; border-radius: 4px; }
</style>
</head>
<body>
<h2>Client Diagnostic</h2>
<div id="log"></div>
<script>
(function(){
  var log = document.getElementById('log');
  function add(cls, text) {
    var p = document.createElement('pre');
    p.className = cls;
    p.textContent = text;
    log.appendChild(p);
  }

  try {
    // 1. Basic info
    add('ok', '1. Origin: ' + location.origin);
    add('ok', '   Protocol: ' + location.protocol);
    add('ok', '   Host: ' + location.host);
    
    // 2. document.cookie
    var rawCookie = document.cookie;
    add('ok', '2. document.cookie length: ' + rawCookie.length);
    if (rawCookie.length > 0) {
      var cookies = rawCookie.split(';').map(function(c) {
        var parts = c.trim().split('=');
        return parts[0] + ' (' + (parts.slice(1).join('=').length) + ' chars)';
      });
      add('ok', '   Cookie names: ' + cookies.join(', '));
      var sb = cookies.filter(function(c) { return c.indexOf('sb-') === 0; });
      add(sb.length > 0 ? 'ok' : 'warn', '   Supabase cookies: ' + (sb.length > 0 ? sb.join(', ') : 'NONE'));
    } else {
      add('warn', '   No cookies found!');
    }

    // 3. localStorage
    try {
      var lsKeys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') >= 0) lsKeys.push(k);
      }
      add('ok', '3. localStorage sb-* keys: ' + (lsKeys.length > 0 ? lsKeys.join(', ') : 'none'));
    } catch(e) {
      add('err', '3. localStorage error: ' + e.message);
    }

    // 4. Test fetch to same origin
    add('ok', '4. Testing fetch /api/debug-auth...');
    fetch('/api/debug-auth', { credentials: 'same-origin' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        add('ok', '   Fetch OK: ' + JSON.stringify(data, null, 2));
      })
      .catch(function(e) {
        add('err', '   Fetch error: ' + e.message);
      });

    // 5. Test Supabase auth (using supabase-js from CDN)
    add('ok', '5. Loading Supabase from CDN...');
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload = function() {
      add('ok', '   Supabase loaded');
      try {
        var sb = window.supabase.createClient(
          '${supabaseUrl}',
          '${supabaseKey}',
          {
            auth: {
              flowType: 'pkce',
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: true
            }
          }
        );
        
        // Check session
        sb.auth.getSession().then(function(result) {
          if (result.error) {
            add('err', '   getSession error: ' + result.error.message);
          } else if (result.data.session) {
            add('ok', '   SESSION FOUND! User: ' + result.data.session.user.id.substring(0, 8) + '...');
            add('ok', '   Email: ' + (result.data.session.user.email || 'n/a'));
            add('ok', '   Expires: ' + new Date(result.data.session.expires_at * 1000).toISOString());
          } else {
            add('warn', '   No session (getSession returned null)');
          }
        }).catch(function(e) {
          add('err', '   getSession catch: ' + e.message);
        });

        // Also try createBrowserClient-like approach  
        // Read cookies manually to check what createBrowserClient would see
        var projectRef = '${supabaseUrl}'.replace('https://', '').replace('.supabase.co', '');
        var storageKey = 'sb-' + projectRef + '-auth-token';
        add('ok', '   Looking for cookie chunks: ' + storageKey);
        
        var chunks = [];
        for (var i = 0; i < 10; i++) {
          var name = storageKey + '.' + i;
          var found = false;
          document.cookie.split(';').forEach(function(c) {
            var pair = c.trim().split('=');
            if (pair[0] === name) {
              chunks.push(name + '=' + pair.slice(1).join('=').substring(0, 20) + '...');
              found = true;
            }
          });
          if (!found) break;
            break;
          }
        }
        add(chunks.length > 0 ? 'ok' : 'warn', '   Cookie chunks found: ' + (chunks.length > 0 ? chunks.join(', ') : 'NONE'));
        
      } catch(e) {
        add('err', '   Supabase init error: ' + e.message + '\\n' + e.stack);
      }
    };
    s.onerror = function() {
      add('err', '   Failed to load Supabase CDN');
    };
    document.head.appendChild(s);
    
  } catch(e) {
    add('err', 'GLOBAL ERROR: ' + e.message + '\\n' + e.stack);
  }

  // 6. Global error handler
  window.onerror = function(msg, url, line, col, err) {
    add('err', 'UNCAUGHT: ' + msg + ' at ' + url + ':' + line + ':' + col);
  };
  window.onunhandledrejection = function(e) {
    add('err', 'UNHANDLED REJECTION: ' + (e.reason ? e.reason.message || e.reason : e));
  };
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
