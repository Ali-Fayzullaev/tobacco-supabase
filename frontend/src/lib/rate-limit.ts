/**
 * ═══════════════════════════════════════════════════════════
 * IN-MEMORY RATE LIMITER (Sliding Window)
 * ═══════════════════════════════════════════════════════════
 * 
 * Серверный rate limiter на основе скользящего окна.
 * Лимитирует количество запросов по ключу (IP, userId и т.д.)
 * за заданный интервал времени.
 * 
 * Особенности:
 * - Sliding window (точнее, чем fixed window)
 * - Автоочистка устаревших записей (GC каждые 60 сек)
 * - Zero dependencies — работает в Edge и Node.js
 * - Возвращает заголовки X-RateLimit-* для клиента
 * 
 * Использование:
 *   const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
 *   const result = limiter.check(clientIP);
 *   if (!result.allowed) return new Response('Too Many Requests', { status: 429 });
 * 
 * ⚠️  In-memory — при перезагрузке сервера счётчики сбросятся.
 *     Для production-кластера с несколькими инстансами 
 *     используйте Redis (Upstash) или Supabase-based limiter.
 * ═══════════════════════════════════════════════════════════
 */

interface RateLimitConfig {
  /** Максимум запросов в окне */
  maxRequests: number;
  /** Длительность окна в мс (по умолчанию 60 000 = 1 мин) */
  windowMs: number;
}

interface RateLimitResult {
  /** Разрешён ли запрос */
  allowed: boolean;
  /** Сколько запросов осталось */
  remaining: number;
  /** Максимум запросов в окне */
  limit: number;
  /** Через сколько мс сбросится самый старый запрос */
  retryAfterMs: number;
  /** Заголовки для ответа */
  headers: Record<string, string>;
}

interface SlidingWindowEntry {
  /** Временные метки каждого запроса в окне */
  timestamps: number[];
  /** Время последнего обращения (для GC) */
  lastAccess: number;
}

/**
 * Создаёт rate limiter с заданной конфигурацией.
 * Каждый вызов createRateLimiter() — отдельный счётчик.
 * Используйте разные инстансы для разных эндпоинтов.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs } = config;
  const store = new Map<string, SlidingWindowEntry>();

  // ─── Автоочистка устаревших записей ───
  // Запускается каждые 60 сек, удаляет ключи, к которым не обращались > 2 окон
  const GC_INTERVAL = 60_000;
  const gcTimer = setInterval(() => {
    const now = Date.now();
    const expiry = windowMs * 2;
    for (const [key, entry] of store) {
      if (now - entry.lastAccess > expiry) {
        store.delete(key);
      }
    }
  }, GC_INTERVAL);

  // Не блокируем завершение процесса
  if (gcTimer && typeof gcTimer === 'object' && 'unref' in gcTimer) {
    gcTimer.unref();
  }

  /**
   * Проверяет, разрешён ли запрос для данного ключа.
   * @param key — уникальный идентификатор клиента (IP, userId, combo)
   */
  function check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [], lastAccess: now };
      store.set(key, entry);
    }

    // Удаляем запросы за пределами окна
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);
    entry.lastAccess = now;

    if (entry.timestamps.length < maxRequests) {
      // Запрос разрешён
      entry.timestamps.push(now);
      const remaining = maxRequests - entry.timestamps.length;

      return {
        allowed: true,
        remaining,
        limit: maxRequests,
        retryAfterMs: 0,
        headers: {
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil((windowStart + windowMs) / 1000)),
        },
      };
    }

    // Запрос заблокирован
    const oldestTimestamp = entry.timestamps[0];
    const retryAfterMs = oldestTimestamp + windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      limit: maxRequests,
      retryAfterMs: Math.max(retryAfterMs, 0),
      headers: {
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil((oldestTimestamp + windowMs) / 1000)),
        'Retry-After': String(Math.ceil(Math.max(retryAfterMs, 0) / 1000)),
      },
    };
  }

  /**
   * Сбрасывает счётчик для ключа (например, после успешного логина).
   */
  function reset(key: string): void {
    store.delete(key);
  }

  /**
   * Текущее количество отслеживаемых ключей (для мониторинга).
   */
  function size(): number {
    return store.size;
  }

  return { check, reset, size };
}

// ─── Готовые пресеты для разных эндпоинтов ───

/** Смена пароля: 5 попыток / 15 мин (brute-force protection) */
export const changePasswordLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 минут
});

/** Отчёты об ошибках: 10 / мин (anti-spam) */
export const errorReportLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 минута
});

/** Загрузка файлов: 20 / 5 мин  */
export const uploadLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 5 * 60 * 1000, // 5 минут
});

/** Авторизация (логин): 10 попыток / 15 мин */
export const authLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
});

/** Security events (bot/fraud logs): 30 / 5 мин */
export const securityEventLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 5 * 60 * 1000,
});

// ─── Хелпер: извлечь IP из NextRequest ───

import { NextRequest } from 'next/server';

/**
 * Извлекает клиентский IP из заголовков запроса.
 * Поддерживает: x-forwarded-for (Nginx), x-real-ip, cf-connecting-ip (Cloudflare).
 * Fallback: 'unknown'.
 */
export function getClientIP(request: NextRequest): string {
  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();

  // Nginx proxy
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for может содержать цепочку: "client, proxy1, proxy2"
    const firstIP = forwarded.split(',')[0].trim();
    if (firstIP) return firstIP;
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP.trim();

  return 'unknown';
}

/**
 * Создаёт составной ключ для rate limiter.
 * Комбинирует IP + userId для более точного лимитирования.
 */
export function rateLimitKey(ip: string, userId?: string | null): string {
  return userId ? `${ip}:${userId}` : ip;
}
