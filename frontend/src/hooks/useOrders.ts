'use client';

import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { DeliveryMethod, PaymentMethod, OrderStatus } from '@/lib/database.types';

interface OrderListItem {
  id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  payment_status: string;
  created_at: string;
  items_count: number;
  total_count: number;
}

interface CreateOrderParams {
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  deliveryCity: string;
  deliveryStreet: string;
  deliveryBuilding: string;
  deliveryApartment?: string;
  deliveryComment?: string;
  contactName?: string;
  contactPhone?: string;
  orderComment?: string;
}

interface CreateOrderResult {
  success: boolean;
  order_id?: number;
  order_number?: string;
  total_amount?: number;
  error?: string;
  insufficient_stock?: Array<{
    product_id: number;
    name: string;
    requested: number;
    available: number;
  }>;
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

  // Загрузка списка заказов
  const loadOrders = useCallback(async (page: number = 1, pageSize: number = 10) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await supabase.rpc('get_my_orders', {
      page_number: page,
      page_size: pageSize,
    });

    if (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    const orders = (data || []) as OrderListItem[];
    const totalCount = orders[0]?.total_count || 0;

    setState({
      orders,
      isLoading: false,
      error: null,
      totalCount: Number(totalCount),
      currentPage: page,
    });

    return { success: true, data: orders };
  }, [supabase]);

  // Создание заказа
  const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResult> => {
    setState(prev => ({ ...prev, isLoading: true }));

    const { data, error } = await supabase.rpc('create_order', {
      delivery_method_param: params.deliveryMethod,
      payment_method_param: params.paymentMethod,
      delivery_city_param: params.deliveryCity,
      delivery_street_param: params.deliveryStreet,
      delivery_building_param: params.deliveryBuilding,
      delivery_apartment_param: params.deliveryApartment || null,
      delivery_comment_param: params.deliveryComment || null,
      contact_name_param: params.contactName || null,
      contact_phone_param: params.contactPhone || null,
      order_comment_param: params.orderComment || null,
    });

    setState(prev => ({ ...prev, isLoading: false }));

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as CreateOrderResult;
    return result;
  };

  // Получение деталей заказа
  const getOrderDetails = async (orderId: number) => {
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
