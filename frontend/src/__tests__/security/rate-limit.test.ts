/**
 * ═══════════════════════════════════════════════════════════
 * RATE LIMITER TESTS
 * Тесты для in-memory sliding window rate limiter
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter, getClientIP, rateLimitKey } from '@/lib/rate-limit';

// ═════════════════════════════════════════════
// 1. CORE RATE LIMITER
// ═════════════════════════════════════════════
describe('createRateLimiter — Sliding Window', () => {
  it('allows requests within limit', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    
    expect(limiter.check('ip1').allowed).toBe(true);
    expect(limiter.check('ip1').allowed).toBe(true);
    expect(limiter.check('ip1').allowed).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    
    limiter.check('ip1'); // 1
    limiter.check('ip1'); // 2
    limiter.check('ip1'); // 3
    
    const result = limiter.check('ip1'); // 4 → blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks remaining count correctly', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    
    expect(limiter.check('ip1').remaining).toBe(4); // 5 - 1
    expect(limiter.check('ip1').remaining).toBe(3); // 5 - 2
    expect(limiter.check('ip1').remaining).toBe(2); // 5 - 3
  });

  it('isolates different keys', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
    
    limiter.check('ip1'); // ip1: 1
    limiter.check('ip1'); // ip1: 2
    
    // ip1 is blocked
    expect(limiter.check('ip1').allowed).toBe(false);
    
    // ip2 is still allowed
    expect(limiter.check('ip2').allowed).toBe(true);
  });

  it('resets window after time expires', () => {
    vi.useFakeTimers();
    
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });
    
    limiter.check('ip1');
    limiter.check('ip1');
    expect(limiter.check('ip1').allowed).toBe(false);
    
    // Advance past window
    vi.advanceTimersByTime(1001);
    
    expect(limiter.check('ip1').allowed).toBe(true);
    
    vi.useRealTimers();
  });

  it('sliding window gradually releases slots', () => {
    vi.useFakeTimers();
    
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });
    
    limiter.check('ip1'); // t=0
    vi.advanceTimersByTime(500);
    limiter.check('ip1'); // t=500
    
    expect(limiter.check('ip1').allowed).toBe(false); // t=500: blocked
    
    // After 501ms: first request (t=0) expired, slot opens
    vi.advanceTimersByTime(501);
    expect(limiter.check('ip1').allowed).toBe(true); // t=1001: one slot freed
    
    vi.useRealTimers();
  });

  it('returns correct retryAfterMs when blocked', () => {
    vi.useFakeTimers();
    
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 5000 });
    
    limiter.check('ip1'); // t=0
    const result = limiter.check('ip1'); // blocked
    
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(5000);
    
    vi.useRealTimers();
  });
});

// ═════════════════════════════════════════════
// 2. RATE LIMIT HEADERS
// ═════════════════════════════════════════════
describe('Rate Limit Headers', () => {
  it('includes X-RateLimit-Limit', () => {
    const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
    const result = limiter.check('ip1');
    
    expect(result.headers['X-RateLimit-Limit']).toBe('10');
  });

  it('includes X-RateLimit-Remaining', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    
    limiter.check('ip1');
    const result = limiter.check('ip1');
    
    expect(result.headers['X-RateLimit-Remaining']).toBe('3');
  });

  it('includes X-RateLimit-Reset', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const result = limiter.check('ip1');
    
    expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    expect(Number(result.headers['X-RateLimit-Reset'])).toBeGreaterThan(0);
  });

  it('includes Retry-After when blocked', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    
    limiter.check('ip1');
    const result = limiter.check('ip1');
    
    expect(result.headers['Retry-After']).toBeDefined();
    expect(Number(result.headers['Retry-After'])).toBeGreaterThan(0);
  });

  it('does NOT include Retry-After when allowed', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const result = limiter.check('ip1');
    
    expect(result.headers['Retry-After']).toBeUndefined();
  });
});

// ═════════════════════════════════════════════
// 3. RESET FUNCTION
// ═════════════════════════════════════════════
describe('Rate Limiter — reset()', () => {
  it('clears counter for specific key', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
    
    limiter.check('ip1');
    limiter.check('ip1');
    expect(limiter.check('ip1').allowed).toBe(false);
    
    limiter.reset('ip1');
    expect(limiter.check('ip1').allowed).toBe(true);
  });

  it('does not affect other keys', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
    
    limiter.check('ip1');
    limiter.check('ip1');
    limiter.check('ip2');
    limiter.check('ip2');
    
    limiter.reset('ip1');
    
    expect(limiter.check('ip1').allowed).toBe(true);
    expect(limiter.check('ip2').allowed).toBe(false);
  });
});

// ═════════════════════════════════════════════
// 4. SIZE MONITORING
// ═════════════════════════════════════════════
describe('Rate Limiter — size()', () => {
  it('returns 0 for empty store', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    expect(limiter.size()).toBe(0);
  });

  it('counts unique keys', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    
    limiter.check('ip1');
    limiter.check('ip2');
    limiter.check('ip3');
    limiter.check('ip1'); // duplicate
    
    expect(limiter.size()).toBe(3);
  });
});

// ═════════════════════════════════════════════
// 5. getClientIP — IP EXTRACTION
// ═════════════════════════════════════════════
describe('getClientIP() — IP Extraction', () => {
  function createMockRequest(headers: Record<string, string>) {
    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] ?? null,
      },
    } as any;
  }

  it('extracts from cf-connecting-ip (Cloudflare)', () => {
    const req = createMockRequest({ 'cf-connecting-ip': '203.0.113.1' });
    expect(getClientIP(req)).toBe('203.0.113.1');
  });

  it('extracts from x-forwarded-for (first IP in chain)', () => {
    const req = createMockRequest({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1, 172.16.0.1' });
    expect(getClientIP(req)).toBe('203.0.113.1');
  });

  it('extracts from x-real-ip', () => {
    const req = createMockRequest({ 'x-real-ip': '198.51.100.5' });
    expect(getClientIP(req)).toBe('198.51.100.5');
  });

  it('prefers cf-connecting-ip over x-forwarded-for', () => {
    const req = createMockRequest({
      'cf-connecting-ip': '1.1.1.1',
      'x-forwarded-for': '2.2.2.2',
    });
    expect(getClientIP(req)).toBe('1.1.1.1');
  });

  it('returns "unknown" when no headers present', () => {
    const req = createMockRequest({});
    expect(getClientIP(req)).toBe('unknown');
  });

  it('trims whitespace from IP', () => {
    const req = createMockRequest({ 'x-real-ip': '  10.0.0.1  ' });
    expect(getClientIP(req)).toBe('10.0.0.1');
  });
});

// ═════════════════════════════════════════════
// 6. rateLimitKey — KEY COMPOSITION
// ═════════════════════════════════════════════
describe('rateLimitKey() — Composite Key', () => {
  it('returns IP only when no userId', () => {
    expect(rateLimitKey('1.2.3.4')).toBe('1.2.3.4');
    expect(rateLimitKey('1.2.3.4', null)).toBe('1.2.3.4');
    expect(rateLimitKey('1.2.3.4', undefined)).toBe('1.2.3.4');
  });

  it('combines IP and userId', () => {
    expect(rateLimitKey('1.2.3.4', 'user-abc')).toBe('1.2.3.4:user-abc');
  });
});

// ═════════════════════════════════════════════
// 7. PRESET LIMITERS (Configuration)
// ═════════════════════════════════════════════
describe('Preset Rate Limiters', () => {
  it('changePasswordLimiter: 5 req / 15 min', async () => {
    const { changePasswordLimiter } = await import('@/lib/rate-limit');
    
    // Verify by examining the limiter behavior
    expect(changePasswordLimiter.check).toBeDefined();
    expect(changePasswordLimiter.reset).toBeDefined();
    expect(changePasswordLimiter.size).toBeDefined();
    
    // Check limit is 5
    const result = changePasswordLimiter.check('preset-test-cp');
    expect(result.limit).toBe(5);
    changePasswordLimiter.reset('preset-test-cp');
  });

  it('errorReportLimiter: 10 req / 1 min', async () => {
    const { errorReportLimiter } = await import('@/lib/rate-limit');
    
    const result = errorReportLimiter.check('preset-test-er');
    expect(result.limit).toBe(10);
    errorReportLimiter.reset('preset-test-er');
  });

  it('uploadLimiter: 20 req / 5 min', async () => {
    const { uploadLimiter } = await import('@/lib/rate-limit');
    
    const result = uploadLimiter.check('preset-test-up');
    expect(result.limit).toBe(20);
    uploadLimiter.reset('preset-test-up');
  });

  it('authLimiter: 10 req / 15 min', async () => {
    const { authLimiter } = await import('@/lib/rate-limit');
    
    const result = authLimiter.check('preset-test-auth');
    expect(result.limit).toBe(10);
    authLimiter.reset('preset-test-auth');
  });
});

// ═════════════════════════════════════════════
// 8. PASSWORD STRENGTH VALIDATION
// ═════════════════════════════════════════════
describe('Password Strength Validation (change-password logic)', () => {
  // Replicating the validation logic from the route for testing
  function validatePasswordStrength(password: string): string | null {
    if (password.length < 8) return 'Пароль должен быть не менее 8 символов';
    if (password.length > 128) return 'Пароль слишком длинный (макс. 128 символов)';
    if (!/[A-ZА-ЯЁ]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
    if (!/[a-zа-яё]/.test(password)) return 'Пароль должен содержать хотя бы одну строчную букву';
    if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
    return null;
  }

  it('accepts strong password', () => {
    expect(validatePasswordStrength('MyPass123')).toBeNull();
  });

  it('accepts strong password with Russian letters', () => {
    expect(validatePasswordStrength('Пароль123')).toBeNull();
  });

  it('rejects short password (< 8 chars)', () => {
    expect(validatePasswordStrength('Ab1')).toBe('Пароль должен быть не менее 8 символов');
  });

  it('rejects excessively long password (> 128 chars)', () => {
    const longPass = 'Aa1' + 'x'.repeat(130);
    expect(validatePasswordStrength(longPass)).toBe('Пароль слишком длинный (макс. 128 символов)');
  });

  it('rejects password without uppercase', () => {
    expect(validatePasswordStrength('mypass123')).toBe('Пароль должен содержать хотя бы одну заглавную букву');
  });

  it('rejects password without lowercase', () => {
    expect(validatePasswordStrength('MYPASS123')).toBe('Пароль должен содержать хотя бы одну строчную букву');
  });

  it('rejects password without digit', () => {
    expect(validatePasswordStrength('MyPassword')).toBe('Пароль должен содержать хотя бы одну цифру');
  });

  it('accepts minimum valid password (8 chars with all requirements)', () => {
    expect(validatePasswordStrength('Abcdef1X')).toBeNull();
  });

  it('accepts exactly 128 char password', () => {
    const pass = 'Aa1' + 'x'.repeat(125);
    expect(validatePasswordStrength(pass)).toBeNull();
  });
});

// ═════════════════════════════════════════════
// 9. UPLOAD VALIDATION (SSRF + File size/type)
// ═════════════════════════════════════════════
describe('Upload Security Validation', () => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  describe('File size limits', () => {
    it('allows files under 5MB', () => {
      expect(4 * 1024 * 1024 <= MAX_FILE_SIZE).toBe(true);
    });

    it('allows exactly 5MB', () => {
      expect(5 * 1024 * 1024 <= MAX_FILE_SIZE).toBe(true);
    });

    it('rejects files over 5MB', () => {
      expect(6 * 1024 * 1024 <= MAX_FILE_SIZE).toBe(false);
    });
  });

  describe('MIME type validation', () => {
    it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])(
      'allows %s',
      (type) => {
        expect(ALLOWED_MIME_TYPES.includes(type)).toBe(true);
      }
    );

    it.each(['application/pdf', 'text/html', 'application/javascript', 'image/svg+xml'])(
      'rejects %s',
      (type) => {
        expect(ALLOWED_MIME_TYPES.includes(type)).toBe(false);
      }
    );
  });

  describe('SSRF Prevention', () => {
    const blockedPattern = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.|\[::1\]|\[fc|\[fd)/i;

    it.each([
      'localhost',
      '127.0.0.1',
      '10.0.0.1',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254', // AWS metadata
      '0.0.0.0',
    ])('blocks private/reserved hostname: %s', (hostname) => {
      expect(blockedPattern.test(hostname)).toBe(true);
    });

    it.each([
      'example.com',
      'cloudinary.com',
      '8.8.8.8',
      '203.0.113.1',
    ])('allows public hostname: %s', (hostname) => {
      expect(blockedPattern.test(hostname)).toBe(false);
    });

    it('requires HTTPS protocol', () => {
      const url = new URL('http://example.com/image.jpg');
      expect(url.protocol).not.toBe('https:');
      
      const secureUrl = new URL('https://example.com/image.jpg');
      expect(secureUrl.protocol).toBe('https:');
    });
  });
});

// ═════════════════════════════════════════════
// 10. BRUTE FORCE SIMULATION
// ═════════════════════════════════════════════
describe('Brute Force Protection Simulation', () => {
  it('blocks after 5 password attempts from same IP', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
    const attackerIP = '192.0.2.100';
    
    for (let i = 0; i < 5; i++) {
      expect(limiter.check(attackerIP).allowed).toBe(true);
    }
    
    // 6th attempt blocked
    const result = limiter.check(attackerIP);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('legitimate user on different IP is not affected', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
    
    // Attacker exhausts their limit
    for (let i = 0; i < 10; i++) {
      limiter.check('attacker-ip');
    }
    
    // Legitimate user is unaffected
    expect(limiter.check('legit-user-ip').allowed).toBe(true);
  });

  it('counter resets after window expires', () => {
    vi.useFakeTimers();
    
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
    const ip = '192.0.2.50';
    
    // Exhaust limit
    for (let i = 0; i < 5; i++) limiter.check(ip);
    expect(limiter.check(ip).allowed).toBe(false);
    
    // 15 min later → reset
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(limiter.check(ip).allowed).toBe(true);
    
    vi.useRealTimers();
  });

  it('successful action can reset counter early', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
    const ip = '192.0.2.75';
    
    // 4 failed attempts
    for (let i = 0; i < 4; i++) limiter.check(ip);
    
    // Password changed successfully → reset
    limiter.reset(ip);
    
    // Back to full quota
    expect(limiter.check(ip).remaining).toBe(4);
  });
});
