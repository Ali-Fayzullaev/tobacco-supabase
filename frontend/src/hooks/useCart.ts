'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    name: string;
    name_kk: string | null;
    price: number;
    in_stock: boolean;
    slug: string;
    image_url?: string | null;
    brand?: string | null;
  };
}

interface CartState {
  cartItems: CartItem[];
  isLoading: boolean;
  error: string | null;
  totalAmount: number;
  totalItems: number;
}

export function useCart() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<CartState>({
    cartItems: [],
    isLoading: false,
    error: null,
    totalAmount: 0,
    totalItems: 0,
  });

  // Загрузка корзины
  const loadCart = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({
          cartItems: [],
          isLoading: false,
          error: null,
          totalAmount: 0,
          totalItems: 0,
        });
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Сначала получаем cart_items
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select('id, product_id, quantity')
        .eq('user_id', session.user.id);

      if (cartError || !cartData || cartData.length === 0) {
        setState({
          cartItems: [],
          isLoading: false,
          error: null,
          totalAmount: 0,
          totalItems: 0,
        });
        return;
      }

      // Получаем ID всех продуктов
      const productIds = cartData.map(item => item.product_id);

      // Загружаем продукты отдельным запросом
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, name_kk, price, in_stock, slug, image_url, brand')
        .in('id', productIds);

      if (productsError) {
        setState({
          cartItems: [],
          isLoading: false,
          error: null,
          totalAmount: 0,
          totalItems: 0,
        });
        return;
      }

      // Создаём map продуктов для быстрого доступа
      const productsMap = new Map(
        (productsData || []).map(p => [p.id, p])
      );

      // Собираем cartItems с продуктами
      const cartItems: CartItem[] = cartData
        .map(item => {
          const product = productsMap.get(item.product_id);
          if (!product) return null;
          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            product: {
              name: product.name,
              name_kk: product.name_kk,
              price: product.price,
              in_stock: product.in_stock,
              slug: product.slug,
              image_url: product.image_url,
              brand: product.brand,
            },
          };
        })
        .filter((item): item is CartItem => item !== null);

      const totalAmount = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      setState({
        cartItems,
        isLoading: false,
        error: null,
        totalAmount,
        totalItems,
      });
    } catch (e) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
    }
  }, [supabase]);

  // Загрузка при монтировании
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Добавление в корзину
  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Необходимо войти в систему' };
      }

      setState(prev => ({ ...prev, isLoading: true }));

      // Проверяем, есть ли уже такой товар в корзине
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', session.user.id)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Обновляем количество
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Добавляем новый
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: session.user.id,
            product_id: productId,
            quantity,
          });

        if (error) throw error;
      }

      await loadCart();
      return { success: true, message: 'Товар добавлен в корзину' };
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message };
    }
  };

  // Обновление количества
  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      if (newQuantity <= 0) {
        // Удаляем
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', cartItemId);

        if (error) throw error;
      } else {
        // Обновляем
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', cartItemId);

        if (error) throw error;
      }

      await loadCart();
      return { success: true };
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message };
    }
  };

  // Удаление из корзины
  const removeItem = async (cartItemId: string) => {
    return updateQuantity(cartItemId, 0);
  };

  // Очистка корзины
  const clearCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Not authenticated' };

      setState(prev => ({ ...prev, isLoading: true }));

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;

      setState({
        cartItems: [],
        isLoading: false,
        error: null,
        totalAmount: 0,
        totalItems: 0,
      });

      return { success: true };
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message };
    }
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
