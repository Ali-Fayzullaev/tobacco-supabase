'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  recentOrders: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Get dashboard stats via RPC function
      const { data, error } = await supabase
        .rpc('admin_get_dashboard_stats');

      if (error) throw error;

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          profile:profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalOrders: data?.total_orders || 0,
        totalRevenue: data?.total_revenue || 0,
        totalProducts: data?.total_products || 0,
        totalUsers: data?.total_users || 0,
        pendingOrders: data?.pending_orders || 0,
        recentOrders: recentOrders || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Всего заказов',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      href: '/admin/orders',
    },
    {
      label: 'Выручка',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/admin/orders',
    },
    {
      label: 'Товаров',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
      href: '/admin/products',
    },
    {
      label: 'Пользователей',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-orange-500',
      href: '/admin/users',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        {stats?.pendingOrders ? (
          <Link
            href="/admin/orders?status=pending"
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium"
          >
            <ShoppingBag className="w-4 h-4" />
            {stats.pendingOrders} новых заказов
          </Link>
        ) : null}
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.color} rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Последние заказы</h2>
            <Link
              href="/admin/orders"
              className="text-gold-600 hover:underline text-sm"
            >
              Все заказы
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Номер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-gold-600 hover:underline font-medium"
                    >
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-gray-900">
                        {order.profile?.first_name} {order.profile?.last_name}
                      </p>
                      <p className="text-gray-500 text-sm">{order.profile?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Заказов пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Новый', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Подтверждён', color: 'bg-blue-100 text-blue-800' },
    processing: { label: 'В обработке', color: 'bg-purple-100 text-purple-800' },
    shipped: { label: 'Отправлен', color: 'bg-indigo-100 text-indigo-800' },
    delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
