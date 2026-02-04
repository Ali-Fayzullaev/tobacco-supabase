'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Eye, Loader2 } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import type { OrderWithItems } from '@/lib/database.types';

export default function OrdersPage() {
  const { loadOrders, orders, isLoading } = useOrders();

  useEffect(() => {
    loadOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои заказы</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">У вас пока нет заказов</h2>
          <p className="text-gray-500 mb-6">
            Перейдите в каталог, чтобы выбрать товары
          </p>
          <Link
            href="/catalog"
            className="inline-block bg-gold-500 hover:bg-gold-600 text-white py-3 px-6 rounded-lg font-medium"
          >
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Мои заказы</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusLabel = getStatusLabel(order.status);
  const statusColor = getStatusColor(order.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-semibold text-gray-900">
                Заказ #{order.order_number}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              от {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-gold-600">
              {formatPrice(order.total_amount)}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-gold-600 hover:underline text-sm"
            >
              <Eye className="w-4 h-4" />
              {isExpanded ? 'Скрыть' : 'Подробнее'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 bg-gray-50">
          {/* Items */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Товары</h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <div>
                    <p className="text-gray-900">{item.product?.name || 'Товар'}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatPrice(item.quantity * item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Доставка</h3>
              <p className="text-gray-600 text-sm">
                {order.delivery_method === 'courier' && 'Курьерская доставка'}
                {order.delivery_method === 'pickup' && 'Самовывоз'}
                {order.delivery_method === 'post' && 'Почтой'}
              </p>
              {order.shipping_address && (
                <p className="text-gray-600 text-sm mt-1">
                  {typeof order.shipping_address === 'object' 
                    ? `${(order.shipping_address as any).city}, ${(order.shipping_address as any).address}`
                    : order.shipping_address
                  }
                </p>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Оплата</h3>
              <p className="text-gray-600 text-sm">
                {order.payment_method === 'kaspi' && 'Kaspi перевод'}
                {order.payment_method === 'card' && 'Банковская карта'}
                {order.payment_method === 'cash' && 'Наличными'}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Статус: {order.payment_status === 'paid' ? 'Оплачено' : 'Ожидает оплаты'}
              </p>
            </div>
          </div>

          {/* Comment */}
          {order.comment && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Комментарий</h3>
              <p className="text-gray-600 text-sm">{order.comment}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
