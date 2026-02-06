'use client';

import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

type DeliveryMethod = 'courier' | 'pickup' | 'post';
type PaymentMethod = 'kaspi' | 'card' | 'cash';
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  product_deleted?: boolean;
  product_name_snapshot?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
  } | null;
}

interface OrderListItem {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  subtotal?: number;
  delivery_method: DeliveryMethod;
  delivery_cost: number;
  payment_method: PaymentMethod;
  payment_status: string;
  shipping_address: any;
  phone: string | null;
  comment: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface CreateOrderParams {
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  shippingAddress: {
    city: string;
    address: string;
    apartment?: string;
    postalCode?: string;
  };
  phone: string;
  comment?: string;
}

export interface CreateOrderResult {
  success: boolean;
  order_id?: string;
  order_number?: string;
  total_amount?: number;
  error?: string;
}

interface OrdersState {
  orders: OrderListItem[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
}

export function useOrders() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<OrdersState>({
    orders: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
  });

  // Загрузка списка заказов с товарами
  const loadOrders = useCallback(async (page: number = 1, pageSize: number = 20) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Not authenticated' }));
        return { success: false, error: 'Not authenticated' };
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Загружаем заказы с товарами
      const { data, error, count } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            order_id,
            product_id,
            quantity,
            price,
            product_deleted,
            product_name_snapshot,
            product:products(id, name, slug, image_url)
          )
        `, { count: 'exact' })
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      const orders = (data || []) as OrderListItem[];

      setState({
        orders,
        isLoading: false,
        error: null,
        totalCount: count || 0,
        currentPage: page,
      });

      return { success: true, data: orders };
    } catch (e: any) {
      setState(prev => ({ ...prev, isLoading: false, error: e.message }));
      return { success: false, error: e.message };
    }
  }, [supabase]);

  // Создание заказа
  const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      setState(prev => ({ ...prev, isLoading: true }));

      // Получаем товары из корзины
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          product:products(price, name)
        `)
        .eq('user_id', session.user.id);

      if (cartError || !cartItems?.length) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Корзина пуста' };
      }

      // Считаем сумму
      const totalAmount = cartItems.reduce((sum, item: any) => {
        const product = Array.isArray(item.product) ? item.product[0] : item.product;
        return sum + (product?.price || 0) * item.quantity;
      }, 0);

      // Создаём заказ
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          status: 'pending',
          total_amount: totalAmount,
          delivery_method: params.deliveryMethod,
          payment_method: params.paymentMethod,
          payment_status: 'pending',
          shipping_address: {
            city: params.shippingAddress.city,
            address: params.shippingAddress.address,
            apartment: params.shippingAddress.apartment || null,
            postalCode: params.shippingAddress.postalCode || null,
          },
          phone: params.phone,
          comment: params.comment || null,
        })
        .select()
        .single();

      if (orderError) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: orderError.message };
      }

      // Создаём позиции заказа
      const orderItems = cartItems.map((item: any) => {
        const product = Array.isArray(item.product) ? item.product[0] : item.product;
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: product?.price || 0,
          product_name: product?.name || 'Товар',
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // Удаляем заказ если не удалось добавить позиции
        await supabase.from('orders').delete().eq('id', order.id);
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: itemsError.message };
      }

      // Очищаем корзину
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id);

      setState(prev => ({ ...prev, isLoading: false }));

      return {
        success: true,
        order_id: order.id,
        order_number: order.order_number,
        total_amount: totalAmount,
      };
    } catch (e: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: e.message };
    }
  };

  // Получение деталей заказа
  const getOrderDetails = async (orderId: string) => {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      return { success: false, error: orderError.message };
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    return {
      success: true,
      data: {
        ...order,
        items: items || [],
      },
    };
  };

  return {
    ...state,
    loadOrders,
    createOrder,
    getOrderDetails,
  };
}
