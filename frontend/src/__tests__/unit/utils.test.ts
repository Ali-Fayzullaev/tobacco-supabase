/**
 * ═══════════════════════════════════════════════════════════
 * UNIT TESTS — utils.ts
 * Тестирование утилитарных функций: форматирование, валидация,
 * безопасность ввода, транслитерация, склонение
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest';
import {
  cn,
  formatPrice,
  formatDate,
  formatDateTime,
  isAdult,
  getMaxBirthDate,
  pluralize,
  formatProductCount,
  generateSlug,
  truncate,
  isValidEmail,
  isValidKZPhone,
  formatPhone,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils';

// ─────────────────────────────────────────────
// cn() — Tailwind class merging
// ─────────────────────────────────────────────
describe('cn() — class merging', () => {
  it('merges simple classes', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('handles undefined/null/empty inputs', () => {
    expect(cn(undefined, null, '', 'valid')).toBe('valid');
  });
});

// ─────────────────────────────────────────────
// formatPrice() — Цены в KZT
// ─────────────────────────────────────────────
describe('formatPrice() — currency formatting', () => {
  it('formats positive integer', () => {
    const result = formatPrice(15000);
    // Должен содержать число и символ валюты
    expect(result).toMatch(/15[\s\u00A0]?000/);
  });

  it('formats zero', () => {
    const result = formatPrice(0);
    expect(result).toMatch(/0/);
  });

  it('handles large amounts (free delivery threshold)', () => {
    const result = formatPrice(200000);
    expect(result).toMatch(/200[\s\u00A0]?000/);
  });

  it('formats negative amounts', () => {
    const result = formatPrice(-5000);
    expect(result).toMatch(/5[\s\u00A0]?000/);
  });

  it('does not show decimal digits', () => {
    const result = formatPrice(15000.99);
    expect(result).not.toMatch(/\.\d{2}/);
  });
});

// ─────────────────────────────────────────────
// formatDate() / formatDateTime()
// ─────────────────────────────────────────────
describe('formatDate()', () => {
  it('formats ISO date string to russian locale', () => {
    const result = formatDate('2025-03-15');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2025/);
  });

  it('accepts Date object', () => {
    const result = formatDate(new Date(2025, 2, 15));
    expect(result).toMatch(/15/);
  });

  it('throws on invalid date input (expected behavior — validate before calling)', () => {
    // formatDate expects valid date strings — caller must validate input
    expect(() => formatDate('not-a-date')).toThrow();
  });
});

describe('formatDateTime()', () => {
  it('includes time in output', () => {
    const result = formatDateTime('2025-03-15T14:30:00Z');
    // Должно содержать часы и минуты
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

// ─────────────────────────────────────────────
// isAdult() — Проверка 21+ (ст. 110 Кодекса РК)
// ─────────────────────────────────────────────
describe('isAdult() — 21+ age verification (КЗ law)', () => {
  it('returns true for person exactly 21 years old', () => {
    const date21YearsAgo = new Date();
    date21YearsAgo.setFullYear(date21YearsAgo.getFullYear() - 21);
    expect(isAdult(date21YearsAgo)).toBe(true);
  });

  it('returns true for person 30 years old', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 30);
    expect(isAdult(date)).toBe(true);
  });

  it('returns false for person 20 years old', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 20);
    expect(isAdult(date)).toBe(false);
  });

  it('returns false for person 18 years old (NOT 21)', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    expect(isAdult(date)).toBe(false);
  });

  it('returns false for minor (15 years old)', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 15);
    expect(isAdult(date)).toBe(false);
  });

  it('handles birthday edge case — day before 21st birthday', () => {
    const tomorrow21 = new Date();
    tomorrow21.setFullYear(tomorrow21.getFullYear() - 21);
    tomorrow21.setDate(tomorrow21.getDate() + 1);
    expect(isAdult(tomorrow21)).toBe(false);
  });

  it('accepts string date format', () => {
    expect(isAdult('1990-01-01')).toBe(true);
  });

  it('rejects future birth dates', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isAdult(future)).toBe(false);
  });
});

describe('getMaxBirthDate()', () => {
  it('returns date string in YYYY-MM-DD format', () => {
    const result = getMaxBirthDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returned date makes person exactly 21 years old', () => {
    const maxDate = getMaxBirthDate();
    expect(isAdult(maxDate)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// pluralize() — Russian/Kazakh word declension
// ─────────────────────────────────────────────
describe('pluralize()', () => {
  it('returns "one" form for count 1', () => {
    expect(pluralize(1, 'товар', 'товара', 'товаров')).toBe('товар');
  });

  it('returns "few" form for counts 2-4', () => {
    expect(pluralize(2, 'товар', 'товара', 'товаров')).toBe('товара');
    expect(pluralize(3, 'товар', 'товара', 'товаров')).toBe('товара');
    expect(pluralize(4, 'товар', 'товара', 'товаров')).toBe('товара');
  });

  it('returns "many" form for counts 5-20', () => {
    expect(pluralize(5, 'товар', 'товара', 'товаров')).toBe('товаров');
    expect(pluralize(11, 'товар', 'товара', 'товаров')).toBe('товаров');
    expect(pluralize(19, 'товар', 'товара', 'товаров')).toBe('товаров');
  });

  it('handles 21, 22, 25 correctly', () => {
    expect(pluralize(21, 'товар', 'товара', 'товаров')).toBe('товар');
    expect(pluralize(22, 'товар', 'товара', 'товаров')).toBe('товара');
    expect(pluralize(25, 'товар', 'товара', 'товаров')).toBe('товаров');
  });

  it('handles 0 items', () => {
    expect(pluralize(0, 'товар', 'товара', 'товаров')).toBe('товаров');
  });

  it('handles 100, 111, 112', () => {
    expect(pluralize(100, 'товар', 'товара', 'товаров')).toBe('товаров');
    expect(pluralize(111, 'товар', 'товара', 'товаров')).toBe('товаров');
    expect(pluralize(112, 'товар', 'товара', 'товаров')).toBe('товаров');
  });
});

describe('formatProductCount()', () => {
  it('formats 1 item', () => {
    expect(formatProductCount(1)).toBe('1 товар');
  });

  it('formats 5 items', () => {
    expect(formatProductCount(5)).toBe('5 товаров');
  });
});

// ─────────────────────────────────────────────
// generateSlug() — Транслитерация (RU/KZ → slug)
// ─────────────────────────────────────────────
describe('generateSlug() — transliteration', () => {
  it('converts Russian text to latin slug', () => {
    expect(generateSlug('Табак для кальяна')).toBe('tabak-dlya-kalyana');
  });

  it('converts Kazakh-specific letters', () => {
    const result = generateSlug('Қазақстан');
    expect(result).toMatch(/^[a-z\-]+$/); // Only latin + hyphens
  });

  it('handles mixed Russian and Latin', () => {
    expect(generateSlug('Premium Табак')).toBe('premium-tabak');
  });

  it('removes special characters', () => {
    const result = generateSlug('Сигареты (в пачках)!');
    expect(result).not.toMatch(/[()!]/);
    expect(result).toMatch(/^[a-z0-9\-]+$/);
  });

  it('removes leading/trailing hyphens', () => {
    const result = generateSlug('  Табак  ');
    expect(result).not.toMatch(/^-|-$/);
  });

  it('handles numbers', () => {
    expect(generateSlug('Marlboro 100s')).toBe('marlboro-100s');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });
});

// ─────────────────────────────────────────────
// truncate() — Text shortening
// ─────────────────────────────────────────────
describe('truncate()', () => {
  it('truncates long text with ellipsis', () => {
    const result = truncate('Длинное описание продукта', 10);
    expect(result.length).toBeLessThanOrEqual(13); // 10 + '...'
    expect(result).toMatch(/\.\.\.$/);
  });

  it('does not truncate short text', () => {
    expect(truncate('короткий', 20)).toBe('короткий');
  });

  it('handles exact length', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });
});

// ─────────────────────────────────────────────
// isValidEmail() — Email validation
// ─────────────────────────────────────────────
describe('isValidEmail()', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('admin@t.raycon.kz')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@no-user.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
  });

  it('rejects emails with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail('us er@example.com')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// isValidKZPhone() — Kazakhstan phone number
// ─────────────────────────────────────────────
describe('isValidKZPhone() — Kazakhstan phone validation', () => {
  it('accepts valid +7 phone numbers', () => {
    expect(isValidKZPhone('+77008001800')).toBe(true);
    expect(isValidKZPhone('+77058881919')).toBe(true);
  });

  it('accepts phone with spaces', () => {
    expect(isValidKZPhone('+7 700 800 1800')).toBe(true);
  });

  it('rejects non-KZ phone numbers', () => {
    expect(isValidKZPhone('+1234567890')).toBe(false);
    expect(isValidKZPhone('+86123456789')).toBe(false);
  });

  it('rejects short phone numbers', () => {
    expect(isValidKZPhone('+7700123')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidKZPhone('')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// formatPhone() — Phone formatting
// ─────────────────────────────────────────────
describe('formatPhone()', () => {
  it('formats 11-digit KZ phone number', () => {
    const result = formatPhone('77008001800');
    expect(result).toBe('+7 (700) 800-18-00');
  });

  it('returns original for non-standard formats', () => {
    const original = '+1 (555) 123-4567';
    expect(formatPhone(original)).toBe(original);
  });
});

// ─────────────────────────────────────────────
// getStatusLabel() / getStatusColor()
// ─────────────────────────────────────────────
describe('getStatusLabel()', () => {
  it('returns Russian labels for known statuses', () => {
    expect(getStatusLabel('confirmed')).toBe('Подтверждён');
    expect(getStatusLabel('cancelled')).toBe('Отменён');
  });

  it('returns raw status for unknown values', () => {
    expect(getStatusLabel('unknown_status')).toBe('unknown_status');
  });
});

describe('getStatusColor()', () => {
  it('returns color classes for known statuses', () => {
    const color = getStatusColor('cancelled');
    expect(color).toContain('red');
  });

  it('returns default color for unknown status', () => {
    const color = getStatusColor('unknown');
    expect(color).toContain('text-');
  });
});
