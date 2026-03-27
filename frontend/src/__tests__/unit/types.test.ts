/**
 * ═══════════════════════════════════════════════════════════
 * UNIT TESTS — types.ts
 * Проверка типов, интерфейсов и констант базы данных
 * ═══════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/types';
import type {
  Profile,
  Product,
  Category,
  Order,
  CartItem,
  Favorite,
  OrderItem,
  ProductFull,
  Database,
} from '@/lib/types';

// ─────────────────────────────────────────────
// ORDER_STATUS_LABELS — Все статусы имеют метки
// ─────────────────────────────────────────────
describe('ORDER_STATUS_LABELS', () => {
  const requiredStatuses: Order['status'][] = [
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  ];

  it('has labels for all 6 order statuses', () => {
    expect(Object.keys(ORDER_STATUS_LABELS)).toHaveLength(6);
  });

  requiredStatuses.forEach(status => {
    it(`has label for "${status}"`, () => {
      expect(ORDER_STATUS_LABELS[status]).toBeDefined();
      expect(typeof ORDER_STATUS_LABELS[status]).toBe('string');
      expect(ORDER_STATUS_LABELS[status].length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────
// ORDER_STATUS_COLORS — Все статусы имеют цвета
// ─────────────────────────────────────────────
describe('ORDER_STATUS_COLORS', () => {
  it('has colors for all 6 order statuses', () => {
    expect(Object.keys(ORDER_STATUS_COLORS)).toHaveLength(6);
  });

  it('all colors contain Tailwind classes', () => {
    Object.values(ORDER_STATUS_COLORS).forEach(color => {
      expect(color).toMatch(/bg-/);
      expect(color).toMatch(/text-/);
    });
  });

  it('cancelled status uses red color', () => {
    expect(ORDER_STATUS_COLORS.cancelled).toContain('red');
  });

  it('delivered status uses green color', () => {
    expect(ORDER_STATUS_COLORS.delivered).toContain('green');
  });
});

// ─────────────────────────────────────────────
// Type shape validation (compile-time + runtime checks)
// ─────────────────────────────────────────────
describe('Type shapes', () => {
  it('Profile has all B2B-required fields', () => {
    const profile: Profile = {
      id: 'test-id',
      email: 'test@example.com',
      first_name: 'Иван',
      last_name: 'Иванов',
      phone: '+77001234567',
      birth_date: '1990-01-01',
      city: 'Астана',
      address: 'ул. Тестовая 1',
      organization_name: 'ТОО Premium Tobacco',
      bin_iin: '123456789012',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // B2B обязательные поля из ТЗ
    expect(profile.organization_name).toBeDefined();
    expect(profile.bin_iin).toBeDefined();
    expect(profile.first_name).toBeDefined();
    expect(profile.birth_date).toBeDefined();
    expect(profile.phone).toBeDefined();
  });

  it('Product has all catalog-required fields', () => {
    const product: Product = {
      id: 'prod-1',
      name: 'Parliament Night Blue',
      name_kk: null,
      slug: 'parliament-night-blue',
      description: null,
      description_kk: null,
      price: 850,
      old_price: null,
      image_url: null,
      sku: 'PAR-NB-001',
      brand: 'Parliament',
      category_id: 'cat-cigarettes',
      in_stock: true,
      stock: 500,
      is_active: true,
      is_featured: false,
      order_step: 10,  // Кратность из ТЗ
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(product.order_step).toBe(10);
    expect(product.stock).toBeDefined();
    expect(product.in_stock).toBe(true);
    expect(product.sku).toBeDefined();
    expect(product.brand).toBeDefined();
  });

  it('Category supports nesting (parent_id)', () => {
    const parent: Category = {
      id: 'cat-1',
      name: 'Аксессуары',
      name_kk: null,
      slug: 'accessories',
      description: null,
      image_url: null,
      parent_id: null,
      sort_order: 8,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const child: Category = {
      id: 'cat-2',
      name: 'Гильзы',
      name_kk: null,
      slug: 'tubes',
      description: null,
      image_url: null,
      parent_id: parent.id,
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    expect(child.parent_id).toBe(parent.id);
    expect(parent.parent_id).toBeNull();
  });

  it('Order has all B2B fields', () => {
    const order: Order = {
      id: 'order-1',
      user_id: 'user-1',
      order_number: 'PT-0001',
      status: 'pending',
      total_amount: 150000,
      delivery_method: 'courier',
      payment_method: 'invoice',  // Безналичный расчёт из ТЗ
      payment_status: 'pending',
      shipping_address: { city: 'Астана', address: 'ул. Тестовая 1' },
      phone: '+77001234567',
      comment: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(order.payment_method).toBe('invoice');
    expect(order.status).toBe('pending');
  });
});
