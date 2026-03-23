'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Loader2,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Calendar,
  AlertCircle,
  RefreshCw,
  Box,
  ArrowRight,
  Receipt,
  MessageSquare,
  Phone,
  AlertTriangle,
  Trash2,
  Info,
  Bell,
  RotateCcw
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useCart } from '@/hooks/useCart';
import { CenteredPageSkeleton } from '@/components/Skeleton';
import { formatPrice, formatDate, getStatusLabel, getStatusColor, cn } from '@/lib/utils';

// Конфигурация статусов с иконками и градиентами
const statusConfig: Record<string, { 
  label: string; 
  icon: React.ElementType;
  bgGradient: string;
  textColor: string;
  iconBg: string;
  progressWidth: string;
}> = {
  pending: { 
    label: 'Ожидает подтверждения', 
    icon: Clock,
    bgGradient: 'from-yellow-900/20 to-gold-500/5',
    textColor: 'text-yellow-400',
    iconBg: 'bg-yellow-900/30',
    progressWidth: 'w-1/6'
  },
  confirmed: { 
    label: 'Подтверждён', 
    icon: CheckCircle,
    bgGradient: 'from-blue-900/20 to-indigo-900/20',
    textColor: 'text-blue-400',
    iconBg: 'bg-blue-900/30',
    progressWidth: 'w-2/6'
  },
  processing: { 
    label: 'Собирается', 
    icon: Package,
    bgGradient: 'from-purple-900/20 to-violet-900/20',
    textColor: 'text-purple-400',
    iconBg: 'bg-purple-900/30',
    progressWidth: 'w-3/6'
  },
  shipped: { 
    label: 'В пути', 
    icon: Truck,
    bgGradient: 'from-indigo-900/20 to-blue-900/20',
    textColor: 'text-indigo-400',
    iconBg: 'bg-indigo-900/30',
    progressWidth: 'w-4/6'
  },
  delivered: { 
    label: 'Доставлен', 
    icon: CheckCircle,
    bgGradient: 'from-green-900/20 to-emerald-900/20',
    textColor: 'text-green-400',
    iconBg: 'bg-green-900/30',
    progressWidth: 'w-full'
  },
  cancelled: { 
    label: 'Отменён', 
    icon: XCircle,
    bgGradient: 'from-red-900/20 to-rose-900/20',
    textColor: 'text-red-400',
    iconBg: 'bg-red-900/30',
    progressWidth: 'w-0'
  },
};

const paymentMethods: Record<string, { label: string; icon: string }> = {
  kaspi: { label: 'Kaspi', icon: '🏦' },
  card: { label: 'Карта', icon: '💳' },
  cash: { label: 'Наличные', icon: '💵' },
};

const deliveryMethods: Record<string, { label: string; icon: React.ElementType }> = {
  courier: { label: 'Курьер', icon: Truck },
  pickup: { label: 'Самовывоз', icon: MapPin },
  post: { label: 'Почта', icon: Package },
};

export default function OrdersPage() {
  const { loadOrders, orders, isLoading } = useOrders();
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['delivered', 'cancelled'].includes(order.status);
    if (filter === 'completed') return order.status === 'delivered';
    if (filter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  const stats = {
    total: orders.length,
    active: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'delivered').length,
    totalSpent: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0)
  };

  if (isLoading) {
    return (
      <CenteredPageSkeleton
        icon={<Package className="w-6 h-6 text-white" />}
        title="Загрузка заказов..."
      />
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-500/50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            Мои заказы
          </h1>
        </div>
        
        <div className="bg-[#121212] rounded-3xl shadow-sm border border-[#2A2A2A] p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gold-500/15 to-gold-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gold-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-3">Пока нет заказов</h2>
          <p className="text-[#A0A0A0] mb-8 max-w-md mx-auto">
            Самое время что-нибудь заказать! Перейдите в каталог, чтобы выбрать товары.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-500/50 hover:from-gold-600 hover:to-amber-600 text-white py-3.5 px-8 rounded-xl font-semibold shadow-lg shadow-gold-500/30 transition-all"
          >
            Перейти в каталог
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-500/50 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          Мои заказы
        </h1>
        
        <button
          onClick={() => loadOrders()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#252525] hover:bg-[#2A2A2A] text-[#C0C0C0] rounded-xl font-medium transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">Обновить</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F5F5]">{stats.total}</p>
              <p className="text-xs text-[#A0A0A0]">Всего заказов</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F5F5]">{stats.active}</p>
              <p className="text-xs text-[#A0A0A0]">В процессе</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F5F5]">{stats.completed}</p>
              <p className="text-xs text-[#A0A0A0]">Выполнено</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-gold-500/15 to-gold-500/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F5F5]">{formatPrice(stats.totalSpent).replace('₸', '')}<span className="text-base font-medium">₸</span></p>
              <p className="text-xs text-[#A0A0A0]">Всего потрачено</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Все заказы', count: orders.length },
          { key: 'active', label: 'В процессе', count: stats.active },
          { key: 'completed', label: 'Выполненные', count: stats.completed },
          { key: 'cancelled', label: 'Отменённые', count: orders.filter(o => o.status === 'cancelled').length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-xl font-medium text-sm transition-all",
              filter === f.key
                ? "bg-gradient-to-r from-gold-500 to-gold-500/50 text-white shadow-lg shadow-gold-500/30"
                : "bg-[#1E1E1E] border border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#121212]"
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span className={cn(
                "ml-2 px-1.5 py-0.5 rounded-md text-xs",
                filter === f.key ? "bg-[#1E1E1E]/20" : "bg-[#252525]"
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[#A0A0A0]">Нет заказов с таким статусом</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-br from-gold-500/10 to-gold-500/5 rounded-2xl border border-gold-500/20 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-500/50 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#F5F5F5] mb-1">Есть вопросы по заказу?</h3>
            <p className="text-sm text-[#A0A0A0]">Свяжитесь с нами, и мы поможем решить любой вопрос</p>
          </div>
          <div className="flex gap-3">
            <a
              href="tel:+77001234567"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1E1E1E] hover:bg-[#121212] text-[#C0C0C0] rounded-xl font-medium transition-colors border border-[#2A2A2A]"
            >
              <Phone className="w-4 h-4" />
              Позвонить
            </a>
            <a
              href="https://wa.me/77001234567"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const deliveryMethod = deliveryMethods[order.delivery_method || 'courier'];
  const DeliveryIcon = deliveryMethod?.icon || Truck;
  const payment = paymentMethods[order.payment_method || 'cash'];

  // Проверяем есть ли удалённые товары
  const deletedItems = order.items?.filter((item: any) => 
    item.product_deleted || !item.products
  ) || [];
  const hasDeletedProducts = deletedItems.length > 0;
  const deletedCount = deletedItems.length;

  return (
    <div className={cn(
      "bg-[#1E1E1E] rounded-2xl shadow-sm border overflow-hidden transition-all",
      isExpanded ? "border-gold-500/30 shadow-lg shadow-gold-500/5" : "border-[#2A2A2A] hover:border-[#2A2A2A]"
    )}>
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Order Info */}
          <div className="flex items-start gap-4 flex-1">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              status.iconBg
            )}>
              <StatusIcon className={cn("w-6 h-6", status.textColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-[#F5F5F5] text-lg">
                  #{order.order_number}
                </span>
                <span className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full",
                  status.iconBg, status.textColor
                )}>
                  {status.label}
                </span>
                {hasDeletedProducts && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {deletedCount} товар(ов) удалено
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-[#A0A0A0]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Box className="w-4 h-4" />
                  {order.items?.length || 0} товаров
                </span>
              </div>
            </div>
          </div>

          {/* Price & Expand */}
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold bg-gradient-to-r from-gold-500 to-gold-500/50 bg-clip-text text-transparent">
                {formatPrice(order.total_amount)}
              </p>
              <p className="text-xs text-[#A0A0A0]">
                {order.payment_status === 'paid' ? '✓ Оплачено' : 'Ожидает оплаты'}
              </p>
            </div>
            <button className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isExpanded ? "bg-gold-500/15 text-gold-600" : "bg-[#252525] text-[#A0A0A0] hover:bg-[#2A2A2A]"
            )}>
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar - скрываем если есть удалённые товары или заказ отменён */}
        {order.status !== 'cancelled' && !hasDeletedProducts && (
          <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
            <div className="h-2 bg-[#252525] rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-gradient-to-r from-gold-400 to-gold-500/50 rounded-full transition-all duration-500",
                  status.progressWidth
                )}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#666]">
              <span>Оформлен</span>
              <span>Подтверждён</span>
              <span>Собирается</span>
              <span>В пути</span>
              <span>Доставлен</span>
            </div>
          </div>
        )}

        {/* Статус при удалённых товарах */}
        {hasDeletedProducts && order.status !== 'cancelled' && (
          <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-gold-500/30">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Заказ обрабатывается с учётом изменений
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Некоторые товары были исключены из заказа
                </p>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold",
                status.iconBg, status.textColor
              )}>
                {status.label}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={cn("border-t", `bg-gradient-to-br ${status.bgGradient}`)}>
          {/* Warning about deleted items */}
          {hasDeletedProducts && (
            <div className="mx-5 mt-5 p-4 bg-gradient-to-r from-[#252525] to-gold-500/5 border border-gold-500/30 rounded-xl">
              <div className="flex gap-3">
                <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-800 flex items-center gap-2">
                    Внимание: изменения в заказе
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    <strong>{deletedCount}</strong> товар(ов) был(и) удалён(ы) из ассортимента и исключён(ы) из вашего заказа.
                    Сумма заказа была автоматически пересчитана.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-600 font-medium">
                      Проверьте уведомления (🔔) для подробной информации
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="p-5 border-b border-[#2A2A2A]/50">
            <h3 className="font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold-500" />
              Товары в заказе
            </h3>
            <div className="space-y-3">
              {order.items?.map((item: any) => {
                const isDeleted = item.product_deleted || !item.products;
                const productName = item.products?.name || item.product_name_snapshot || 'Товар удалён';
                const productImage = item.products?.image_url;

                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all",
                      isDeleted 
                        ? "bg-red-900/20 border-red-800/30" 
                        : "bg-[#1E1E1E]/80 border-transparent"
                    )}
                  >
                    {/* Product Image */}
                    <div className={cn(
                      "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative",
                      isDeleted ? "opacity-60" : ""
                    )}>
                      {productImage && !isDeleted ? (
                        <img 
                          src={productImage} 
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center",
                          isDeleted ? "bg-red-900/30" : "bg-[#252525]"
                        )}>
                          {isDeleted ? (
                            <Trash2 className="w-6 h-6 text-red-400" />
                          ) : (
                            <Package className="w-6 h-6 text-[#666]" />
                          )}
                        </div>
                      )}
                      {isDeleted && productImage && (
                        <div className="absolute inset-0 bg-red-900/200/30 flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      {isDeleted ? (
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-red-400 line-through">
                              {productName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="text-sm text-red-400 font-medium">
                              Товар удалён из ассортимента
                            </span>
                          </div>
                          <p className="text-xs text-red-500 mt-1">
                            Стоимость исключена из заказа
                          </p>
                        </div>
                      ) : (
                        <>
                          <Link 
                            href={`/product/${item.products?.slug || item.product_id}`}
                            className="font-medium text-[#F5F5F5] hover:text-gold-500 transition-colors"
                          >
                            {productName}
                          </Link>
                          <p className="text-sm text-[#A0A0A0] mt-0.5">
                            {item.quantity} шт. × {formatPrice(item.price)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      {isDeleted ? (
                        <div>
                          <span className="font-medium text-red-400 line-through">
                            {formatPrice(item.quantity * item.price)}
                          </span>
                          <p className="text-xs text-red-500 mt-0.5">Возвращено</p>
                        </div>
                      ) : (
                        <span className="font-bold text-[#F5F5F5]">
                          {formatPrice(item.quantity * item.price)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-[#2A2A2A]/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#A0A0A0]">Товары</span>
                <span className="text-[#C0C0C0]">{formatPrice(order.subtotal || order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#A0A0A0]">Доставка</span>
                <span className={order.delivery_cost === 0 ? "text-green-400 font-medium" : "text-[#C0C0C0]"}>
                  {order.delivery_cost === 0 ? 'Бесплатно' : formatPrice(order.delivery_cost)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#2A2A2A]/50">
                <span className="text-[#F5F5F5]">Итого</span>
                <span className="bg-gradient-to-r from-gold-500 to-gold-500/50 bg-clip-text text-transparent">
                  {formatPrice(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="p-5 grid sm:grid-cols-2 gap-6">
            {/* Delivery */}
            <div className="bg-[#1E1E1E]/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <DeliveryIcon className="w-5 h-5 text-gold-500" />
                <h4 className="font-semibold text-[#F5F5F5]">Доставка</h4>
              </div>
              <p className="text-[#C0C0C0] font-medium">{deliveryMethod?.label}</p>
              {order.shipping_address && (
                <p className="text-sm text-[#A0A0A0] mt-2 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {typeof order.shipping_address === 'object' 
                      ? `${(order.shipping_address as any).city}, ${(order.shipping_address as any).address}`
                      : order.shipping_address
                    }
                  </span>
                </p>
              )}
            </div>

            {/* Payment */}
            <div className="bg-[#1E1E1E]/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-gold-500" />
                <h4 className="font-semibold text-[#F5F5F5]">Оплата</h4>
              </div>
              <p className="text-[#C0C0C0] font-medium flex items-center gap-2">
                <span>{payment?.icon}</span>
                {payment?.label}
              </p>
              <p className={cn(
                "text-sm mt-2 flex items-center gap-2",
                order.payment_status === 'paid' ? "text-green-400" : "text-amber-600"
              )}>
                {order.payment_status === 'paid' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Оплачено
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Ожидает оплаты
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Comment */}
          {order.comment && (
            <div className="px-5 pb-5">
              <div className="bg-[#1E1E1E]/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-[#666]" />
                  <h4 className="font-medium text-[#C0C0C0] text-sm">Комментарий к заказу</h4>
                </div>
                <p className="text-[#A0A0A0] text-sm">{order.comment}</p>
              </div>
            </div>
          )}

          {/* Repeat Order */}
          <div className="px-5 pb-5">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setIsReordering(true);
                try {
                  const activeItems = (order.items || []).filter(
                    (item: any) => !item.product_deleted && item.products
                  );
                  if (activeItems.length === 0) {
                    const { toast } = await import('sonner');
                    toast.error('Нет доступных товаров для повтора');
                    return;
                  }
                  for (const item of activeItems) {
                    await addToCart(item.product_id, item.quantity);
                  }
                  const { toast } = await import('sonner');
                  toast.success(`${activeItems.length} товар(ов) добавлено в корзину`);
                  router.push('/cart');
                } catch {
                  const { toast } = await import('sonner');
                  toast.error('Ошибка при повторе заказа');
                } finally {
                  setIsReordering(false);
                }
              }}
              disabled={isReordering}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-500 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {isReordering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
              Повторить заказ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
