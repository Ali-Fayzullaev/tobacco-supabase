'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  MoreHorizontal,
  Calendar,
  Activity,
  PieChart,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { StatCardSkeleton, TableSkeleton, AdminDashboardSkeleton } from '@/components/Skeleton';
import { formatPrice, cn } from '@/lib/utils';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  recentOrders: any[];
  todayOrders: number;
  todayRevenue: number;
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
      
      // Get counts
      const [productsResult, usersResult, ordersResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount, status, created_at'),
      ]);

      const orders = ordersResult.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      
      // Today stats
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Get recent orders with profile
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          profile:profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsResult.count || 0,
        totalUsers: usersResult.count || 0,
        pendingOrders,
        recentOrders: recentOrders || [],
        todayOrders: todayOrders.length,
        todayRevenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  const statCards = [
    {
      label: 'Всего заказов',
      value: stats?.totalOrders || 0,
      change: `+${stats?.todayOrders || 0} сегодня`,
      trend: 'up',
      icon: ShoppingBag,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-900/20',
      textColor: 'text-blue-400',
      href: '/admin/orders',
    },
    {
      label: 'Выручка',
      value: formatPrice(stats?.totalRevenue || 0),
      change: `+${formatPrice(stats?.todayRevenue || 0)} сегодня`,
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgLight: 'bg-green-900/20',
      textColor: 'text-green-400',
      href: '/admin/orders',
    },
    {
      label: 'Товаров',
      value: stats?.totalProducts || 0,
      change: 'активных',
      trend: 'neutral',
      icon: Package,
      color: 'from-purple-500 to-violet-600',
      bgLight: 'bg-purple-900/20',
      textColor: 'text-purple-400',
      href: '/admin/products',
    },
    {
      label: 'Пользователей',
      value: stats?.totalUsers || 0,
      change: 'зарегистрировано',
      trend: 'neutral',
      icon: Users,
      color: 'from-gold-500 to-amber-600',
      bgLight: 'bg-gold-500/10',
      textColor: 'text-gold-600',
      href: '/admin/users',
    },
  ];

  const quickActions = [
    { label: 'Добавить товар', href: '/admin/products/new', icon: Package, color: 'bg-purple-900/200' },
    { label: 'Все заказы', href: '/admin/orders', icon: ShoppingBag, color: 'bg-blue-900/200' },
    { label: 'Пользователи', href: '/admin/users', icon: Users, color: 'bg-gold-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] flex items-center gap-2">
            <Activity className="w-8 h-8 text-gold-500" />
            Дашборд
          </h1>
          <p className="text-[#A0A0A0] mt-1">Обзор магазина и статистика</p>
        </div>
        
        {stats?.pendingOrders ? (
          <Link
            href="/admin/orders?status=pending"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-gold-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-gold-500/30 hover:shadow-xl transition-all animate-pulse"
          >
            <Clock className="w-5 h-5" />
            {stats.pendingOrders} новых заказов
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        ) : null}
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-[#1E1E1E] rounded-2xl shadow-sm border border-[#2A2A2A] p-5 sm:p-6 hover:shadow-xl hover:border-[#2A2A2A] transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg", stat.color)}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                stat.bgLight, stat.textColor
              )}>
                {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] mb-1 group-hover:text-gold-600 transition-colors">
              {stat.value}
            </p>
            <p className="text-[#A0A0A0] text-sm">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Быстрые действия
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 bg-[#1E1E1E]/10 hover:bg-[#1E1E1E]/20 backdrop-blur-sm rounded-xl p-4 transition-all group"
            >
              <div className={cn("p-2 rounded-lg", action.color)}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium group-hover:translate-x-1 transition-transform">
                {action.label}
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#666] ml-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#1E1E1E] rounded-2xl shadow-sm border border-[#2A2A2A] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F5F5]">Последние заказы</h2>
              <p className="text-sm text-[#A0A0A0] mt-0.5">Актуальные заказы клиентов</p>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-gold-600 hover:text-gold-700 text-sm font-medium"
            >
              Все заказы
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#121212]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                  Заказ
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {stats?.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#121212] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[#F5F5F5] hover:text-gold-600 font-semibold transition-colors"
                    >
                      #{order.order_number}
                    </Link>
                    <p className="text-xs text-[#666] mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {order.profile?.first_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-[#F5F5F5] font-medium">
                          {order.profile?.first_name} {order.profile?.last_name}
                        </p>
                        <p className="text-[#666] text-xs">{order.profile?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-[#F5F5F5]">{formatPrice(order.total_amount)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-[#A0A0A0] hover:text-gold-600 text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Подробнее
                    </Link>
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-[#A0A0A0]">Заказов пока нет</p>
                    <p className="text-[#666] text-sm mt-1">Они появятся здесь после первой покупки</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Card */}
        <div className="bg-[#1E1E1E] rounded-2xl shadow-sm border border-[#2A2A2A] p-6">
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#666]" />
            Активность
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#F5F5F5]">Выполненные заказы</p>
                  <p className="text-sm text-[#A0A0A0]">За всё время</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-400">
                {stats?.recentOrders.filter(o => o.status === 'delivered').length || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-900/200 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#F5F5F5]">Ожидают обработки</p>
                  <p className="text-sm text-[#A0A0A0]">Требуют внимания</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-400">
                {stats?.pendingOrders || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900/200 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#F5F5F5]">В доставке</p>
                  <p className="text-sm text-[#A0A0A0]">На пути к клиентам</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-400">
                {stats?.recentOrders.filter(o => o.status === 'shipped').length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-gradient-to-br from-gold-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Сегодня
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#1E1E1E]/20 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-white/80 text-sm">Заказов</span>
              </div>
              <p className="text-3xl font-bold">{stats?.todayOrders || 0}</p>
            </div>
            <div className="bg-[#1E1E1E]/20 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-white/80 text-sm">Выручка</span>
              </div>
              <p className="text-2xl font-bold">{formatPrice(stats?.todayRevenue || 0)}</p>
            </div>
            <div className="bg-[#1E1E1E]/20 backdrop-blur-sm rounded-xl p-4 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-white/80 text-sm">Дата</span>
              </div>
              <p className="text-xl font-semibold">
                {new Date().toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Новый', color: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30', icon: Clock },
    confirmed: { label: 'Подтверждён', color: 'bg-blue-900/30 text-blue-400 border-blue-800/30', icon: CheckCircle },
    processing: { label: 'В обработке', color: 'bg-purple-900/30 text-purple-400 border-purple-800/30', icon: Package },
    shipped: { label: 'Отправлен', color: 'bg-indigo-900/30 text-indigo-400 border-indigo-800/30', icon: Truck },
    delivered: { label: 'Доставлен', color: 'bg-green-900/30 text-green-400 border-green-800/30', icon: CheckCircle },
    cancelled: { label: 'Отменён', color: 'bg-red-900/30 text-red-400 border-red-800/30', icon: XCircle },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-[#252525] text-[#C0C0C0] border-[#2A2A2A]', icon: MoreHorizontal };
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
      config.color
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
