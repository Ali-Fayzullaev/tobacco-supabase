import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getClientIP, securityEventLimiter } from '@/lib/rate-limit';

type SecurityEventPayload = {
  eventType: 'login_attempt' | 'login_failed' | 'login_success' | 'register_attempt' | 'register_failed' | 'register_success' | 'bot_honeypot_triggered';
  outcome?: 'success' | 'failed' | 'blocked';
  email?: string | null;
  reason?: string | null;
  path?: string | null;
  honeypotFilled?: boolean;
  meta?: Record<string, unknown>;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validatePayload(payload: unknown): payload is SecurityEventPayload {
  if (!isObject(payload)) return false;

  const allowedEvents = new Set([
    'login_attempt',
    'login_failed',
    'login_success',
    'register_attempt',
    'register_failed',
    'register_success',
    'bot_honeypot_triggered',
  ]);

  if (!payload.eventType || typeof payload.eventType !== 'string' || !allowedEvents.has(payload.eventType)) {
    return false;
  }

  if (payload.outcome && !['success', 'failed', 'blocked'].includes(String(payload.outcome))) return false;
  if (payload.email && typeof payload.email !== 'string') return false;
  if (payload.reason && typeof payload.reason !== 'string') return false;
  if (payload.path && typeof payload.path !== 'string') return false;
  if (payload.honeypotFilled !== undefined && typeof payload.honeypotFilled !== 'boolean') return false;
  if (payload.meta !== undefined && !isObject(payload.meta)) return false;

  return true;
}

function safeText(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  return value.slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const rl = securityEventLimiter.check(clientIP);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many security events' }, { status: 429, headers: rl.headers });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const body = await req.json();
    if (!validatePayload(body)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const payloadForLog = {
      eventType: body.eventType,
      outcome: body.outcome || null,
      email: safeText(body.email?.toLowerCase() || null, 200),
      reason: safeText(body.reason || null, 500),
      path: safeText(body.path || req.nextUrl.pathname, 300),
      honeypotFilled: !!body.honeypotFilled,
      ip: clientIP,
      userAgent: safeText(userAgent, 500),
      meta: body.meta || {},
      ts: new Date().toISOString(),
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    const { error } = await supabase.from('error_reports').insert({
      message: `[SECURITY] ${body.eventType}`,
      stack: JSON.stringify(payloadForLog),
      url: body.path || null,
      user_id: null,
      user_consent: false,
    });

    if (error) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201, headers: rl.headers });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
