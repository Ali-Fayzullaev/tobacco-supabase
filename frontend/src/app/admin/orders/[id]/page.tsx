'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Loader2,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Hash,
  FileText,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { OrderSkeleton } from '@/components/Skeleton';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { formatPrice, cn } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Новый', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  confirmed: { label: 'Подтверждён', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
  processing: { label: 'В обработке', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Package },
  shipped: { label: 'Отправлен', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Truck },
  delivered: { label: 'Доставлен', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Отменён', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Наличными при получении',
  card: 'Банковская карта',
  kaspi: 'Kaspi QR / Перевод',
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Сначала получаем заказ
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        throw new Error(orderError.message);
      }

      // Получаем профиль пользователя
      let profile = null;
      if (orderData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url')
          .eq('id', orderData.user_id)
          .single();
        profile = profileData;
      }

      // Получаем товары заказа (включая информацию о удалённых)
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          product_deleted,
          product_name_snapshot,
          product:products(id, name, slug, image_url)
        `)
        .eq('order_id', orderId);

      setOrder({
        ...orderData,
        profile,
        items: itemsData || []
      });
    } catch (err: any) {
      console.error('Error loading order:', err);
      setError(err.message || 'Заказ не найден');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { error } = await supabase
        .rpc('admin_update_order_status', {
          p_order_id: orderId,
          p_status: newStatus,
        });

      if (error) throw error;

      loadOrder();
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <OrderSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-2">{error || 'Заказ не найден'}</p>
          <Link href="/admin/orders" className="text-orange-500 hover:underline">
            Вернуться к списку заказов
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Заказ #{order.order_number}
              </h1>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold",
                status.bgColor, status.color
              )}>
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </div>
            </div>
            <p className="text-gray-500 mt-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              {new Date(order.created_at).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        
        {/* Status change */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Изменить статус:</span>
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as OrderStatus)}
            disabled={isUpdating}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
          >
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          {isUpdating && <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Товары в заказе</h2>
                  <p className="text-sm text-gray-500">{order.items?.length || 0} позиций</p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any) => {
                const isDeleted = item.product_deleted || !item.product;
                const productName = item.product?.name || item.product_name_snapshot || 'Товар удалён';
                
                return (
                  <div key={item.id} className={cn(
                    "p-4 flex items-center gap-4",
                    isDeleted && "bg-red-50/50"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0",
                      isDeleted ? "bg-red-100" : "bg-gray-100"
                    )}>
                      {item.product?.image_url && !isDeleted ? (
                        <img 
                          src={item.product.image_url} 
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {isDeleted ? (
                            <AlertCircle className="w-6 h-6 text-red-400" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isDeleted ? (
                        <div>
                          <span className="font-medium text-gray-500 line-through">
                            {productName}
                          </span>
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Товар удалён
                          </span>
                        </div>
                      ) : (
                        <Link 
                          href={`/product/${item.product?.slug}`}
                          className="font-medium text-gray-900 hover:text-orange-500 transition-colors"
                        >
                          {productName}
                        </Link>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {formatPrice(item.price)} × {item.quantity} шт
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        isDeleted ? "text-gray-400" : "text-gray-900"
                      )}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Totals */}
            <div className="p-6 bg-gray-50 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Товары</span>
                <span className="text-gray-900">{formatPrice(order.subtotal || order.total_amount)}</span>
              </div>
              {order.delivery_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Доставка</span>
                  <span className="text-gray-900">{formatPrice(order.delivery_cost)}</span>
                </div>
              )}
              {order.delivery_cost === 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Доставка</span>
                  <span className="text-green-600 font-medium">Бесплатно</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Итого</span>
                <span className="text-xl font-bold text-orange-500">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Комментарий к заказу</h2>
              </div>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Покупатель</h2>
            </div>
            
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              {order.profile?.avatar_url ? (
                <img 
                  src={order.profile.avatar_url}
                  alt="Avatar"
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {(order.profile?.first_name || order.customer_name || 'П')?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {order.profile?.first_name && order.profile?.last_name 
                    ? `${order.profile.first_name} ${order.profile.last_name}`
                    : order.customer_name || 'Имя не указано'}
                </p>
                {order.profile?.id && (
                  <Link 
                    href={`/admin/users?id=${order.profile.id}`}
                    className="text-sm text-orange-500 hover:underline"
                  >
                    Профиль пользователя
                  </Link>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {order.customer_email || order.profile?.email || 'Не указан'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {order.customer_phone || order.profile?.phone || 'Не указан'}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Доставка</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Получатель</p>
                <p className="text-gray-900 font-medium">{order.customer_name}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Адрес доставки</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-600">
                    {typeof order.shipping_address === 'object' && order.shipping_address ? (
                      <>
                        {order.shipping_address.city && <p>{order.shipping_address.city}</p>}
                        {order.shipping_address.address && <p>{order.shipping_address.address}</p>}
                        {order.shipping_address.apartment && <p>кв. {order.shipping_address.apartment}</p>}
                        {order.shipping_address.postalCode && <p>Индекс: {order.shipping_address.postalCode}</p>}
                      </>
                    ) : (
                      <p>
                        {order.shipping_address || 'Не указан'}
                        {order.shipping_city && `, ${order.shipping_city}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Оплата</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Способ оплаты</p>
                <p className="text-gray-900 font-medium">
                  {paymentMethodLabels[order.payment_method] || order.payment_method}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Статус оплаты</p>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                  order.payment_status === 'paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                )}>
                  {order.payment_status === 'paid' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Оплачен
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      Ожидает оплаты
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Информация</h2>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID заказа</span>
                <span className="text-gray-900 font-mono text-xs">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Номер заказа</span>
                <span className="text-gray-900 font-medium">#{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Создан</span>
                <span className="text-gray-900">
                  {new Date(order.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              {order.updated_at && order.updated_at !== order.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Обновлён</span>
                  <span className="text-gray-900">
                    {new Date(order.updated_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
