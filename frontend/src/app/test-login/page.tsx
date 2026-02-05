'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function TestLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setStatus('Попытка входа...');

    try {
      // Используем SSR клиент который правильно сохраняет cookies
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus(`Ошибка: ${error.message}`);
      } else if (data.session) {
        setStatus(`Успех! User ID: ${data.user?.id}\nSession: ${data.session.access_token.substring(0, 20)}...`);
        
        // Ждём 2 секунды и редиректим
        setTimeout(() => {
          window.location.href = '/catalog';
        }, 2000);
      } else {
        setStatus('Нет сессии в ответе');
      }
    } catch (e: any) {
      setStatus(`Exception: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Тестовый вход</h1>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Пароль:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
        />
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px',
          background: loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Загрузка...' : 'Войти'}
      </button>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f5f5f5',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
      }}>
        {status || 'Статус появится здесь...'}
      </div>
    </div>
  );
}
