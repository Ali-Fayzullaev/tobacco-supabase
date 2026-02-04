'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product_name_ru: string;
  product_name_kk: string;
  product_price: number;
  product_stock: number;
  product_slug: string;
  primary_image_url: string | null;
  item_total: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  totalAmount: number;
  totalItems: number;
}

export function useCart() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<CartState>({
    items: [],
    isLoading: true,
    error: null,
    totalAmount: 0,
    totalItems: 0,
  });

  // Загрузка корзины
  const loadCart = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await supabase.rpc('get_cart');

    if (error) {
      // Если пользователь не авторизован или не взрослый
      if (error.message.includes('Access denied') || error.code === 'PGRST301') {
        setState({
          items: [],
          isLoading: false,
          error: null,
          totalAmount: 0,
          totalItems: 0,
        });
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return;
    }

    const items = (data || []) as CartItem[];
    const totalAmount = items.reduce((sum, item) => sum + item.item_total, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    setState({
      items,
      isLoading: false,
      error: null,
      totalAmount,
      totalItems,
    });
  }, [supabase]);

  // Загрузка при монтировании
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Добавление в корзину
  const addToCart = async (productId: number, quantity: number = 1) => {
    setState(prev => ({ ...prev, isLoading: true }));

    const { data, error } = await supabase.rpc('add_to_cart', {
      product_id_param: productId,
      quantity_param: quantity,
    });

    if (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string; message?: string };

    if (!result.success) {
      setState(prev => ({ ...prev, isLoading: false, error: result.error || 'Unknown error' }));
      return { success: false, error: result.error };
    }

    await loadCart();
    return { success: true, message: result.message };
  };

  // Обновление количества
  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    setState(prev => ({ ...prev, isLoading: true }));

    const { data, error } = await supabase.rpc('update_cart_quantity', {
      cart_item_id: cartItemId,
      new_quantity: newQuantity,
    });

    if (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };

    if (!result.success) {
      setState(prev => ({ ...prev, isLoading: false, error: result.error || 'Unknown error' }));
      return { success: false, error: result.error };
    }

    await loadCart();
    return { success: true };
  };

  // Удаление из корзины (установка количества в 0)
  const removeItem = async (cartItemId: number) => {
    return updateQuantity(cartItemId, 0);
  };

  // Очистка корзины
  const clearCart = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    const { error } = await supabase.rpc('clear_cart');

    if (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    setState({
      items: [],
      isLoading: false,
      error: null,
      totalAmount: 0,
      totalItems: 0,
    });

    return { success: true };
  };

  return {
    ...state,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: loadCart,
  };
}
