import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { errorReportLimiter, getClientIP } from '@/lib/rate-limit';

// Серверный API-роут для приёма отчётов об ошибках
// Используем Service Role key (из env) — НЕ выставляем его в клиенте

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Проверяем обязательные переменные окружения и даём понятную ошибку в dev режиме

// Валидные поля в теле запроса
type ErrorPayload = {
  message: string;
  stack?: string | null;
  url?: string | null;
  userId?: string | null;
  user_consent?: boolean;
};

// Простая валидация входных данных
function validatePayload(payload: any): payload is ErrorPayload {
  if (!payload || typeof payload !== 'object') return false;
  if (!payload.message || typeof payload.message !== 'string') return false;
  if (payload.stack && typeof payload.stack !== 'string') return false;
  if (payload.url && typeof payload.url !== 'string') return false;
  if (payload.userId && typeof payload.userId !== 'string') return false;
  if (payload.user_consent && typeof payload.user_consent !== 'boolean') return false;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // ─── Rate Limiting: 10 запросов / мин ───
    const clientIP = getClientIP(req);
    const rl = errorReportLimiter.check(clientIP);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many error reports. Try later.' },
        { status: 429, headers: rl.headers }
      );
    }

    // Проверяем env на ранней стадии и возвращаем понятную ошибку
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in env');
      return NextResponse.json({ error: 'Server misconfiguration: missing Supabase service role key' }, { status: 500 });
    }

    const body = await req.json();

    if (!validatePayload(body)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    const { error } = await supabase
      .from('error_reports')
      .insert({
        message: body.message,
        stack: body.stack || null,
        url: body.url || null,
        user_id: body.userId || null,
        user_consent: !!body.user_consent,
      });

    if (error) {
      // Если таблицы нет — даём подсказку
      console.error('Supabase insert error:', error);
      const msg = String(error?.message || error);
      if (/relation .*error_reports.* does not exist/i.test(msg)) {
        return NextResponse.json({ error: 'DB table error: table error_reports not found — run migrations' }, { status: 500 });
      }
      return NextResponse.json({ error: 'DB error', details: msg }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201, headers: rl.headers });
  } catch (err: any) {
    console.error('report-error handler failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
