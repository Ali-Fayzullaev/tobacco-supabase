import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { changePasswordLimiter, getClientIP, rateLimitKey } from '@/lib/rate-limit';

// ─── Валидация силы пароля ───
function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Пароль должен быть не менее 8 символов';
  if (password.length > 128) return 'Пароль слишком длинный (макс. 128 символов)';
  if (!/[A-ZА-ЯЁ]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
  if (!/[a-zа-яё]/.test(password)) return 'Пароль должен содержать хотя бы одну строчную букву';
  if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
  return null;
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // ─── Rate Limiting: 5 попыток / 15 мин ───
    const clientIP = getClientIP(request);
    const rl = changePasswordLimiter.check(clientIP);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Слишком много попыток. Повторите через ${Math.ceil(rl.retryAfterMs / 1000)} сек.` },
        { status: 429, headers: rl.headers }
      );
    }

    const user = await getAuthUser();
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401, headers: rl.headers }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Заполните все поля' },
        { status: 400, headers: rl.headers }
      );
    }

    // Валидация силы нового пароля
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      return NextResponse.json(
        { error: strengthError },
        { status: 400, headers: rl.headers }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'Новый пароль должен отличаться от текущего' },
        { status: 400, headers: rl.headers }
      );
    }

    // Верификация текущего пароля + обновление через одну сессию
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 403, headers: rl.headers }
      );
    }

    // Пароль подтверждён — обновляем через авторизованную сессию
    const { error: updateError } = await authClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Ошибка при обновлении пароля' },
        { status: 500, headers: rl.headers }
      );
    }

    // Успешная смена — сбрасываем лимит для этого IP
    changePasswordLimiter.reset(clientIP);

    return NextResponse.json({ success: true }, { headers: rl.headers });
  } catch {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
