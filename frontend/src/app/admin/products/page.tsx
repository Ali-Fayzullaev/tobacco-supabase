'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  RefreshCw,
  Star,
  Tag,
  Archive,
  MoreVertical,
  ExternalLink,
  CheckSquare,
  Square,
  X,
  AlertCircle,
  ShoppingCart,
  AlertTriangle,
  Info,
  CheckCircle2,
  Users,
  Send,
  MessageSquare,
  Truck
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { formatPrice, cn } from '@/lib/utils';
import type { Product, Category } from '@/lib/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // По умолчанию все товары
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 20;

  // Выбор товаров
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Расширенное удаление с проверкой заказов
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'checking' | 'has_orders' | 'deleting' | 'notifying' | 'done'>('confirm');
  const [productsWithOrders, setProductsWithOrders] = useState<{
    productId: string;
    productName: string;
    orderCount: number;
    orders: { id: string; created_at: string; status: string; user_email: string; user_id: string }[];
  }[]>([]);
  const [productsWithoutOrders, setProductsWithoutOrders] = useState<string[]>([]);
  const [deleteResult, setDeleteResult] = useState<{ deleted: number; hidden: number; notified: number } | null>(null);
  const [customMessage, setCustomMessage] = useState<string>('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, stockFilter, statusFilter, page]);

  const loadCategories = async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('sort_order');
    setCategories(data || []);
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      if (stockFilter === 'in_stock') {
        query = query.eq('in_stock', true);
      } else if (stockFilter === 'out_of_stock') {
        query = query.eq('in_stock', false);
      }

      // Фильтр по статусу активности
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }
      // statusFilter === 'all' - не добавляем фильтр

      const { data, error, count } = await query;

      if (error) throw error;

      setProducts(data || []);
      setTotalPages(Math.ceil((count || 0) / perPage));
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      loadProducts();
    } catch (error) {
      console.error('Error toggling product:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите УДАЛИТЬ этот товар? Это действие нельзя отменить!')) return;

    try {
      const supabase = createBrowserSupabaseClient();
      
      // Удаляем связанные данные
      await supabase.from('product_images').delete().eq('product_id', productId);
      await supabase.from('product_attributes').delete().eq('product_id', productId);
      await supabase.from('favorites').delete().eq('product_id', productId);
      await supabase.from('cart_items').delete().eq('product_id', productId);
      
      // Удаляем товар
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Ошибка при удалении товара');
    }
  };

  // Шаг 1: Проверяем товары на наличие в заказах
  const checkProductsForOrders = async () => {
    setDeleteStep('checking');
    const supabase = createBrowserSupabaseClient();
    const idsArray = Array.from(selectedIds);
    
    try {
      // Получаем товары, которые есть в заказах
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          order:orders (
            id,
            created_at,
            status,
            user_id
          )
        `)
        .in('product_id', idsArray);

      // Группируем по product_id
      const ordersByProduct = new Map<string, Set<string>>();
      const ordersData = new Map<string, any[]>();
      
      orderItems?.forEach((item: any) => {
        if (!ordersByProduct.has(item.product_id)) {
          ordersByProduct.set(item.product_id, new Set());
          ordersData.set(item.product_id, []);
        }
        if (item.order) {
          ordersByProduct.get(item.product_id)!.add(item.order.id);
          ordersData.get(item.product_id)!.push(item.order);
        }
      });

      // Получаем email пользователей для заказов
      const userIds = new Set<string>();
      ordersData.forEach(orders => {
        orders.forEach(order => {
          if (order.user_id) userIds.add(order.user_id);
        });
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Формируем данные о товарах с заказами
      const withOrders: typeof productsWithOrders = [];
      const withoutOrders: string[] = [];

      for (const id of idsArray) {
        const product = products.find(p => p.id === id);
        if (ordersByProduct.has(id)) {
          const orders = ordersData.get(id) || [];
          withOrders.push({
            productId: id,
            productName: product?.name || 'Неизвестный товар',
            orderCount: ordersByProduct.get(id)!.size,
            orders: orders.slice(0, 5).map(o => ({
              id: o.id,
              created_at: o.created_at,
              status: o.status,
              user_id: o.user_id,
              user_email: profileMap.get(o.user_id)?.email || profileMap.get(o.user_id)?.full_name || 'Неизвестный'
            }))
          });
        } else {
          withoutOrders.push(id);
        }
      }

      setProductsWithOrders(withOrders);
      setProductsWithoutOrders(withoutOrders);

      if (withOrders.length > 0) {
        setDeleteStep('has_orders');
      } else {
        // Если нет товаров с заказами - сразу удаляем
        await executeDelete(idsArray, []);
      }
    } catch (error) {
      console.error('Error checking orders:', error);
      setDeleteStep('confirm');
    }
  };

  // Шаг 2: Выполняем удаление
  const executeDelete = async (toDelete: string[], toHide: string[]) => {
    setDeleteStep('deleting');
    setIsDeleting(true);
    
    try {
      const supabase = createBrowserSupabaseClient();
      let deletedCount = 0;
      let hiddenCount = 0;

      // Удаляем товары без заказов
      if (toDelete.length > 0) {
        await supabase.from('product_images').delete().in('product_id', toDelete);
        await supabase.from('product_attributes').delete().in('product_id', toDelete);
        await supabase.from('favorites').delete().in('product_id', toDelete);
        await supabase.from('cart_items').delete().in('product_id', toDelete);
        
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', toDelete);

        if (!error) {
          deletedCount = toDelete.length;
        }
      }

      // Скрываем товары с заказами (если админ выбрал этот вариант)
      if (toHide.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ is_active: false })
          .in('id', toHide);

        if (!error) {
          hiddenCount = toHide.length;
        }
      }

      setDeleteResult({ deleted: deletedCount, hidden: hiddenCount, notified: 0 });
      setDeleteStep('done');
      loadProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Произошла ошибка при удалении');
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  // Принудительное удаление товаров с заказами (с уведомлением клиентов)
  const forceDeleteWithOrders = async (sendNotification: boolean = true) => {
    setDeleteStep('deleting');
    setIsDeleting(true);
    
    try {
      const supabase = createBrowserSupabaseClient();
      const allIds = [...productsWithoutOrders, ...productsWithOrders.map(p => p.productId)];
      const productNames = productsWithOrders.map(p => p.productName);
      
      // Собираем уникальных пользователей для уведомления
      const usersToNotify = new Set<string>();
      productsWithOrders.forEach(p => {
        p.orders.forEach(o => {
          if (o.user_id) usersToNotify.add(o.user_id);
        });
      });

      // Пробуем использовать RPC функцию
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('admin_delete_products', { product_ids: allIds });

      if (rpcError) {
        console.log('RPC not available, using direct delete:', rpcError);
        
        // Fallback: прямое удаление
        await supabase.from('order_items').delete().in('product_id', allIds);
        await supabase.from('product_images').delete().in('product_id', allIds);
        await supabase.from('product_attributes').delete().in('product_id', allIds);
        await supabase.from('favorites').delete().in('product_id', allIds);
        await supabase.from('cart_items').delete().in('product_id', allIds);
        
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', allIds);

        if (error) throw error;
      }

      // Отправляем уведомления клиентам
      let notifiedCount = 0;
      if (sendNotification && usersToNotify.size > 0) {
        setDeleteStep('notifying');
        
        const defaultMessage = `Уважаемый клиент! К сожалению, следующие товары из ваших заказов были удалены из нашего ассортимента: ${productNames.join(', ')}. Приносим извинения за неудобства. Если у вас есть вопросы, пожалуйста, свяжитесь с нами.`;
        
        const userIdsArray = Array.from(usersToNotify);
        for (let i = 0; i < userIdsArray.length; i++) {
          const userId = userIdsArray[i];
          try {
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'product_deleted',
              title: 'Изменение в вашем заказе',
              message: customMessage || defaultMessage,
              data: { product_names: productNames }
            });
            notifiedCount++;
          } catch (e) {
            console.log('Could not send notification:', e);
          }
        }
      }

      setDeleteResult({ deleted: allIds.length, hidden: 0, notified: notifiedCount });
      setDeleteStep('done');
      loadProducts();
    } catch (error) {
      console.error('Error force deleting:', error);
      alert('Произошла ошибка при удалении');
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  // Закрытие модального окна
  const closeDeleteModal = () => {
    setShowDeleteConfirm(false);
    setDeleteStep('confirm');
    setProductsWithOrders([]);
    setProductsWithoutOrders([]);
    setDeleteResult(null);
    setSelectedIds(new Set());
    setCustomMessage('');
  };

  // Массовое изменение статуса
  const toggleSelectedStatus = async (active: boolean) => {
    if (selectedIds.size === 0) return;
    
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('products')
        .update({ is_active: active })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      setSelectedIds(new Set());
      loadProducts();
    } catch (error) {
      console.error('Error updating products:', error);
    }
  };

  // Выбор/снятие выбора товара
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Выбрать все на странице
  const selectAll = () => {
    const allIds = filteredProducts.map(p => p.id);
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  // Очистить выбор
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query)
    );
  });

  // Stats
  const activeCount = products.filter(p => p.is_active).length;
  const inStockCount = products.filter(p => p.in_stock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-500" />
            Товары
          </h1>
          <p className="text-gray-500 mt-1">Управление каталогом товаров</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Обновить</span>
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Добавить товар
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-xs text-gray-500">Всего товаров</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500">Активных</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Archive className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inStockCount}</p>
              <p className="text-xs text-gray-500">В наличии</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-xs text-gray-500">Категорий</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию, SKU, бренду..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 rounded-xl">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="py-3 bg-transparent border-0 focus:ring-0 font-medium text-gray-700"
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 rounded-xl">
            <Archive className="w-5 h-5 text-gray-400" />
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              className="py-3 bg-transparent border-0 focus:ring-0 font-medium text-gray-700"
            >
              <option value="">Все товары</option>
              <option value="in_stock">В наличии</option>
              <option value="out_of_stock">Нет в наличии</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 rounded-xl">
            <Eye className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-3 bg-transparent border-0 focus:ring-0 font-medium text-gray-700"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Скрытые</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-orange-50 border-b border-orange-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium text-orange-700">
                Выбрано: {selectedIds.size}
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-orange-600 hover:text-orange-700 underline"
              >
                Снять выбор
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSelectedStatus(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Eye className="w-4 h-4" />
                Активировать
              </button>
              <button
                onClick={() => toggleSelectedStatus(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                <EyeOff className="w-4 h-4" />
                Скрыть
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Professional Multi-Step */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
              
              {/* Step 1: Initial Confirmation */}
              {deleteStep === 'confirm' && (
                <>
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                        <Trash2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Удаление товаров</h3>
                        <p className="text-gray-500">Выбрано товаров: {selectedIds.size}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-800 font-medium">Внимание!</p>
                          <p className="text-amber-700 text-sm mt-1">
                            Перед удалением система проверит, есть ли выбранные товары в заказах клиентов. 
                            Вы сможете выбрать как поступить с такими товарами.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={closeDeleteModal}
                        className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={checkProductsForOrders}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 transition-all"
                      >
                        Продолжить
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Checking Orders */}
              {deleteStep === 'checking' && (
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Проверяем заказы...</h3>
                  <p className="text-gray-500">Анализируем связи товаров с заказами клиентов</p>
                </div>
              )}

              {/* Step 3: Products Have Orders */}
              {deleteStep === 'has_orders' && (
                <>
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <ShoppingCart className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Товары есть в заказах!</h3>
                        <p className="text-gray-500">
                          {productsWithOrders.length} из {selectedIds.size} товаров заказывали клиенты
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 max-h-[350px] overflow-y-auto">
                    {/* Products without orders - can be deleted */}
                    {productsWithoutOrders.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-900">
                            Можно удалить ({productsWithoutOrders.length})
                          </span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <p className="text-sm text-green-700">
                            Эти товары никто не заказывал — они будут полностью удалены.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Products with orders */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-gray-900">
                          Есть в заказах ({productsWithOrders.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {productsWithOrders.map((item) => (
                          <div key={item.productId} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                                <p className="text-sm text-amber-700">
                                  Заказов: {item.orderCount}
                                </p>
                              </div>
                              <div className="shrink-0 w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-amber-700" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              {item.orders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">{order.user_email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-xs font-medium",
                                      order.status === 'pending' && "bg-yellow-100 text-yellow-700",
                                      order.status === 'confirmed' && "bg-blue-100 text-blue-700",
                                      order.status === 'processing' && "bg-purple-100 text-purple-700",
                                      order.status === 'shipped' && "bg-indigo-100 text-indigo-700",
                                      order.status === 'delivered' && "bg-green-100 text-green-700",
                                      order.status === 'cancelled' && "bg-red-100 text-red-700"
                                    )}>
                                      {order.status === 'pending' && 'Новый'}
                                      {order.status === 'confirmed' && 'Подтверждён'}
                                      {order.status === 'processing' && 'Собирается'}
                                      {order.status === 'shipped' && 'В пути'}
                                      {order.status === 'delivered' && 'Доставлен'}
                                      {order.status === 'cancelled' && 'Отменён'}
                                    </span>
                                    <span className="text-gray-400">
                                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {item.orderCount > 5 && (
                                <p className="text-xs text-amber-600 text-center py-1">
                                  и ещё {item.orderCount - 5} заказов...
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custom message for notification */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <MessageSquare className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-800 font-medium">Сообщение для клиентов</p>
                          <p className="text-blue-700 text-sm">
                            При полном удалении клиенты получат уведомление
                          </p>
                        </div>
                      </div>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Уважаемый клиент! К сожалению, товары из вашего заказа были удалены из нашего ассортимента. Приносим извинения за неудобства..."
                        className="w-full p-3 border border-blue-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {/* Action Buttons - 3 Options */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-4 text-center">Выберите действие для товаров с заказами:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Option 1: Hide */}
                      <button
                        onClick={() => executeDelete(productsWithoutOrders, productsWithOrders.map(p => p.productId))}
                        className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-400 rounded-xl transition-all group"
                      >
                        <div className="w-12 h-12 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center transition-colors">
                          <EyeOff className="w-6 h-6 text-amber-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Скрыть</span>
                        <span className="text-xs text-gray-500 text-center">Товары станут неактивными, история сохранится</span>
                      </button>
                      
                      {/* Option 2: Delete without notification */}
                      <button
                        onClick={() => forceDeleteWithOrders(false)}
                        className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-400 rounded-xl transition-all group"
                      >
                        <div className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center transition-colors">
                          <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Удалить тихо</span>
                        <span className="text-xs text-gray-500 text-center">Удалить без уведомления клиентов</span>
                      </button>
                      
                      {/* Option 3: Delete with notification */}
                      <button
                        onClick={() => forceDeleteWithOrders(true)}
                        className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-2 border-orange-300 hover:border-orange-500 rounded-xl transition-all group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                          <Send className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900">Удалить + Уведомить</span>
                        <span className="text-xs text-gray-500 text-center">Отправить извинения клиентам</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={closeDeleteModal}
                      className="w-full mt-4 px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl font-medium transition-colors text-center"
                    >
                      Отмена
                    </button>
                  </div>
                </>
              )}

              {/* Step 4: Deleting */}
              {deleteStep === 'deleting' && (
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Удаляем товары...</h3>
                  <p className="text-gray-500">Пожалуйста, подождите</p>
                </div>
              )}

              {/* Step 4.5: Notifying */}
              {deleteStep === 'notifying' && (
                <div className="p-12 text-center">
                  <Send className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Отправляем уведомления...</h3>
                  <p className="text-gray-500">Клиенты получат сообщения об изменениях</p>
                </div>
              )}

              {/* Step 5: Done */}
              {deleteStep === 'done' && deleteResult && (
                <>
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Готово!</h3>
                        <p className="text-gray-500">Операция выполнена успешно</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {deleteResult.deleted > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                          <Trash2 className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-red-600">{deleteResult.deleted}</p>
                          <p className="text-sm text-red-700">Удалено</p>
                        </div>
                      )}
                      {deleteResult.hidden > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                          <EyeOff className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-amber-600">{deleteResult.hidden}</p>
                          <p className="text-sm text-amber-700">Скрыто</p>
                        </div>
                      )}
                      {deleteResult.notified > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                          <Send className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-600">{deleteResult.notified}</p>
                          <p className="text-sm text-blue-700">Уведомлено</p>
                        </div>
                      )}
                    </div>
                    {deleteResult.notified > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Клиенты получили уведомления об изменениях</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={closeDeleteModal}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Закрыть
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Загрузка товаров...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <button
                        onClick={selectAll}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                          <CheckSquare className="w-5 h-5 text-orange-500" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Товар
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Категория
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Наличие
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className={cn(
                        "hover:bg-orange-50/50 transition-colors group",
                        selectedIds.has(product.id) && "bg-orange-50"
                      )}
                    >
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleSelect(product.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {selectedIds.has(product.id) ? (
                            <CheckSquare className="w-5 h-5 text-orange-500" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link 
                              href={`/admin/products/${product.id}`}
                              className="font-semibold text-gray-900 hover:text-orange-600 line-clamp-1 transition-colors"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.sku && (
                                <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                              )}
                              {product.brand && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                  {product.brand}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          {(product as any).category?.name || 'Без категории'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900">{formatPrice(product.price)}</p>
                        {product.old_price && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatPrice(product.old_price)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.in_stock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            В наличии
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Нет
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                            product.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {product.is_active ? (
                            <>
                              <Eye className="w-3.5 h-3.5" /> Активен
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" /> Скрыт
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/product/${product.slug}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Открыть на сайте"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Товары не найдены</p>
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
