'use client';

import React from 'react';

// Универсальный блок skeleton (placeholder)
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      className={`skeleton-dark rounded ${className}`}
      style={style}
    />
  );
}

// Skeleton для карточки товара (нужно для каталога)
export function ProductCardSkeleton({ size = 'normal' }: { size?: 'compact' | 'normal' | 'comfortable' }) {
  const sizes: Record<string, any> = {
    compact: { imgH: 'h-28', titleH: 12, lines: 2 },
    normal: { imgH: 'h-36', titleH: 14, lines: 2 },
    comfortable: { imgH: 'h-44', titleH: 16, lines: 3 },
  };
  const s = sizes[size] || sizes.normal;

  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] shadow-sm overflow-hidden flex flex-col h-full">
      <div className={`relative bg-[#252525] ${s.imgH} w-full`}>
        <div className="absolute inset-3 rounded-md overflow-hidden">
          <Skeleton className="w-full h-full rounded-md" />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="w-3/4">
          <Skeleton className={`rounded-md`} style={{ height: s.titleH }} />
        </div>
        <div className="flex gap-2 items-center mt-2">
          <Skeleton className="rounded-md" style={{ width: 80, height: 18 }} />
          <Skeleton className="rounded-md" style={{ width: 48, height: 18 }} />
        </div>
        <div className="mt-auto flex gap-2 items-center">
          <Skeleton className="rounded-md" style={{ width: 90, height: 36 }} />
          <Skeleton className="rounded-md" style={{ width: 36, height: 36 }} />
        </div>
      </div>
    </div>
  );
}

// Compact variant для списка
export function ProductCardCompactSkeleton() {
  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] shadow-sm p-3 flex gap-3 items-center">
      <div className="w-20 h-16 bg-[#252525] rounded-md shrink-0">
        <Skeleton className="w-full h-full rounded-md" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="rounded-md" style={{ height: 14, width: '70%' }} />
        <div className="flex items-center gap-2">
          <Skeleton className="rounded-md" style={{ height: 12, width: 60 }} />
          <Skeleton className="rounded-md" style={{ height: 12, width: 40 }} />
        </div>
      </div>
      <div className="w-24 flex flex-col gap-2">
        <Skeleton className="rounded-md" style={{ height: 32, width: '100%' }} />
      </div>
    </div>
  );
}

// Skeleton для строки таблицы (админка)
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  const cells = new Array(cols).fill(null);
  return (
    <tr className="animate-pulse">
      {cells.map((_, i) => (
        <td key={i} className="px-4 py-3 align-top text-sm">
          <Skeleton className="rounded-md" style={{ height: 14, width: i === 0 ? 120 : '100%' }} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton для карточки статистики (дашборд)
export function StatCardSkeleton() {
  return (
    <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center">
          <Skeleton className="w-8 h-8 rounded-md" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-6 w-24 rounded-md mb-2" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Skeleton для таблицы — заголовок + ряд(ы)
export function TableSkeleton({ cols = 6, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#252525]">
              <tr>
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i} className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                    <Skeleton className="rounded-md" style={{ height: 12, width: i === 0 ? 36 : '80%' }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {Array.from({ length: rows }).map((_, r) => (
                <TableRowSkeleton key={r} cols={cols} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Центрированный page-level skeleton с иконкой и подписью
export function CenteredPageSkeleton({
  icon,
  title = 'Загрузка...',
  subtitle,
}: {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-gold-500/20">
          {icon ? <div className="w-8 h-8">{icon}</div> : <Skeleton className="w-8 h-8 rounded-md" />}
        </div>
        <Skeleton className="h-4 w-36 rounded-md mx-auto mb-3" />
        {subtitle && <Skeleton className="h-3 w-48 rounded-md mx-auto" />}
      </div>
    </div>
  );
}

// Skeleton для детали заказа (админ)
export function OrderSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center">
            <Skeleton className="w-6 h-6 rounded-md" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-6 w-48 rounded-md mb-2" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <Skeleton className="h-10 w-40 rounded-md mx-auto sm:mx-0" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-20 h-16 bg-[#252525] rounded-md shrink-0">
                  <Skeleton className="w-full h-full rounded-md" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
                <div className="w-24">
                  <Skeleton className="h-6 w-full rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4 shadow-sm">
            <Skeleton className="h-4 w-32 rounded-md mb-3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4 shadow-sm">
            <Skeleton className="h-4 w-20 rounded-md mb-3" />
            <Skeleton className="h-6 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Шикарный профессиональный skeleton для админ‑дашборда
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1E1E1E] via-[#252525] to-[#1E1E1E] text-[#F5F5F5] rounded-2xl p-6 shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gold-500/90 flex items-center justify-center shadow-lg">
                <Skeleton className="w-6 h-6 rounded-md" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-6 w-48 rounded-md mb-2" />
                <Skeleton className="h-4 w-64 rounded-md opacity-80" />
              </div>
            </div>
            <div className="mt-6">
              <div className="h-36 bg-gradient-to-r from-white/6 to-white/3 rounded-xl p-4 flex items-end gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex-1 flex items-end">
                    <Skeleton className={`rounded-t-md w-full`} style={{ height: `${30 + (i % 4) * 10}px` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-64 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#1E1E1E]/6 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1E1E1E]/10 rounded-lg flex items-center justify-center">
                  <Skeleton className="w-6 h-6 rounded-md" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 rounded-md mb-2" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ))}
      </div>

      {/* Charts + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
            <Skeleton className="h-10 w-48 rounded-md mb-4" />
            <div className="h-56 bg-[#252525] rounded-lg p-4">
              <div className="h-full flex items-end gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex-1">
                    <Skeleton className="rounded-t-md w-full" style={{ height: `${40 + (i % 5) * 8}px` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
            <Skeleton className="h-4 w-32 rounded-md mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#252525] rounded-full"><Skeleton className="w-full h-full rounded-full" /></div>
                  <div className="flex-1">
                    <Skeleton className="h-3 w-3/4 rounded-md mb-2" />
                    <Skeleton className="h-2 w-1/3 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
            <Skeleton className="h-4 w-28 rounded-md mb-3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Recent orders table */}
      <div>
        <Skeleton className="h-6 w-40 rounded-md mb-4" />
        <TableSkeleton cols={6} rows={5} />
      </div>
    </div>
  );
}

// Шикарный skeleton для страницы Админ → Категории
export function AdminCategoriesSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <Skeleton className="h-8 w-60 rounded-md mb-2" />
          <Skeleton className="h-4 w-96 rounded-md opacity-80" />
        </div>
        <div className="w-48 flex-shrink-0 flex items-center justify-end gap-3">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Top cards / showcase */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center">
              <Skeleton className="w-6 h-6 rounded-md" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 rounded-md mb-2" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      <div className="lg:flex lg:gap-8">
        <main className="flex-1">
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm p-4 sm:p-6 mb-6">
            <Skeleton className="h-6 w-48 rounded-md" />
          </div>

          {/* Categories grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-[#252525] aspect-[4/3]">
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <Skeleton className="h-5 w-3/4 rounded-md mb-2" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Table of categories */}
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm overflow-hidden">
            <div className="p-4">
              <TableSkeleton cols={6} rows={6} />
            </div>
          </div>
        </main>

        {/* Right column — form preview */}
        <aside className="w-80 flex-shrink-0">
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm p-4 space-y-4">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
