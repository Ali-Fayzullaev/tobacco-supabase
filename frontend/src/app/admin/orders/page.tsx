'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Eye, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { formatPrice, cn } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusOptions: { value: OrderStatus | ''; label: string; color: string }[] = [
  { value: '', label: 'Все статусы', color: 'bg-gray-100 text-gray-700' },
  { value: 'pending', label: 'Новые', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Подтверждённые', color: 'bg-blue-100 text-blue-700' },
  { value: 'processing', label: 'В обработке', color: 'bg-purple-100 text-purple-700' },
  { value: 'shipped', label: 'Отправленные', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'delivered', label: 'Доставленные', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Отменённые', color: 'bg-red-100 text-red-700' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Новый', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Подтверждён', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  processing: { label: 'В обработке', color: 'bg-purple-100 text-purple-700', icon: Package },
  shipped: { label: 'Отправлен', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-700', icon: XCircle },
};

function StatusSelect({ value, onChange }: { value: string; onChange: (status: OrderStatus) => void }) {
  const config = statusConfig[value] || { label: value, color: 'bg-gray-100 text-gray-700', icon: MoreHorizontal };
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold", config.color)}>
      <Icon className="w-3.5 h-3.5" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className="bg-transparent border-0 focus:ring-0 p-0 pr-4 text-xs font-semibold cursor-pointer"
      >
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.label}</option>
        ))}
      </select>
    </div>
  );
}

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>(
    (searchParams.get('status') as OrderStatus) || ''
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 20;

  useEffect(() => {
    loadOrders();
  }, [statusFilter, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          profile:profiles(first_name, last_name, email, phone),
          items:order_items(
            id,
            quantity,
            price,
            product:products(name, slug)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setOrders(data || []);
      setTotalPages(Math.ceil((count || 0) / perPage));
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { error } = await supabase
        .rpc('admin_update_order_status', {
          p_order_id: orderId,
          p_status: newStatus,
        });

      if (error) throw error;

      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(query) ||
      order.profile?.first_name?.toLowerCase().includes(query) ||
      order.profile?.last_name?.toLowerCase().includes(query) ||
      order.profile?.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-orange-500" />
            Заказы
          </h1>
          <p className="text-gray-500 mt-1">Управление заказами клиентов</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Обновить
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statusOptions.map((status) => {
          const count = status.value 
            ? orders.filter(o => o.status === status.value).length 
            : totalCount;
          const isActive = statusFilter === status.value;
          return (
            <button
              key={status.value || 'all'}
              onClick={() => {
                setStatusFilter(status.value as OrderStatus | '');
                setPage(1);
              }}
              className={cn(
                "p-3 rounded-xl text-center transition-all",
                isActive 
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30" 
                  : "bg-white hover:shadow-md border border-gray-100"
              )}
            >
              <p className={cn("text-2xl font-bold", !isActive && "text-gray-900")}>
                {count}
              </p>
              <p className={cn("text-xs font-medium", isActive ? "text-orange-100" : "text-gray-500")}>
                {status.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по номеру, имени, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 rounded-xl">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | '');
                setPage(1);
              }}
              className="py-3 bg-transparent border-0 focus:ring-0 font-medium text-gray-700"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Загрузка заказов...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Заказ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-gray-900 hover:text-orange-600 transition-colors"
                        >
                          #{order.order_number}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.items?.length || 0} товаров
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {order.profile?.first_name?.[0] || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {order.profile?.first_name} {order.profile?.last_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{order.profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900">
                          {formatPrice(order.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusSelect
                          value={order.status}
                          onChange={(status) => updateOrderStatus(order.id, status)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('ru-RU')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Детали
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Заказы не найдены</p>
                        <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Показано {(page - 1) * perPage + 1} - {Math.min(page * perPage, totalCount)} из {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-200 bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-200 bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}
