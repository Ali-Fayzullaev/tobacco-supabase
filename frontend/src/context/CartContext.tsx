'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getSupabaseBrowserClient, getPublicSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    name: string;
    name_kk: string | null;
    price: number;
    in_stock: boolean;
    stock?: number;
    slug: string;
    image_url?: string | null;
    brand?: string | null;
  };
}

interface CartContextValue {
  cartItems: CartItem[];
  isLoading: boolean;
  error: string | null;
  totalAmount: number;
  totalItems: number;
  getItemInCart: (productId: string) => CartItem | undefined;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (cartItemId: string) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => Promise<{ success: boolean; error?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const publicSupabase = getPublicSupabaseClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const loadCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setIsLoading(false);
      setError(null);
      setTotalAmount(0);
      setTotalItems(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select('id, product_id, quantity')
        .eq('user_id', user.id);

      if (cartError || !cartData || cartData.length === 0) {
        setCartItems([]);
        setIsLoading(false);
        setError(null);
        setTotalAmount(0);
        setTotalItems(0);
        return;
      }

      const productIds = cartData.map(item => item.product_id);

      // Товары — публичные данные, используем анонимный клиент
      const { data: productsData, error: productsError } = await publicSupabase
        .from('products')
        .select('id, name, name_kk, price, in_stock, stock, slug, image_url, brand')
        .in('id', productIds);

      if (productsError) {
        setCartItems([]);
        setIsLoading(false);
        setError(null);
        setTotalAmount(0);
        setTotalItems(0);
        return;
      }

      const productsMap = new Map(
        (productsData || []).map(p => [p.id, p])
      );

      const items = cartData
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
              stock: product.stock,
              slug: product.slug,
              image_url: product.image_url,
              brand: product.brand,
            },
          };
        })
        .filter(item => item !== null) as CartItem[];

      setCartItems(items);
      setTotalAmount(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
      setTotalItems(items.reduce((sum, item) => sum + item.quantity, 0));
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      setError(null);
    }
  }, [supabase, user]);

  // Загружаем только когда auth готов
  useEffect(() => {
    if (!isAuthLoading) loadCart();
  }, [isAuthLoading, loadCart]);

  const addToCart = useCallback(async (productId: string, quantity: number = 1) => {
    if (!user) {
      return { success: false, error: 'Необходимо войти в систему' };
    }

    try {
      setIsLoading(true);

      // Товары — публичные данные, используем анонимный клиент
      const { data: product } = await publicSupabase
        .from('products')
        .select('stock, order_step')
        .eq('id', productId)
        .maybeSingle();

      const orderStep = product?.order_step || 1;

      if (quantity % orderStep !== 0) {
        setIsLoading(false);
        return { success: false, error: `Товар продаётся упаковками по ${orderStep} шт.` };
      }

      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      const currentInCart = existing?.quantity || 0;
      const requestedTotal = currentInCart + quantity;
      const availableStock = product?.stock ?? 0;

      if (availableStock < requestedTotal) {
        setIsLoading(false);
        const msg = currentInCart > 0
          ? `Недостаточно товара. На складе: ${availableStock}, в корзине уже: ${currentInCart}`
          : `Недостаточно товара. На складе: ${availableStock}`;
        return { success: false, error: msg };
      }

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          });
        if (error) throw error;
      }

      await loadCart();
      return { success: true, message: 'Товар добавлен в корзину' };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, [supabase, user, loadCart]);

  const updateQuantity = useCallback(async (cartItemId: string, newQuantity: number) => {
    try {
      setIsLoading(true);

      if (newQuantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', cartItemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', cartItemId);
        if (error) throw error;
      }

      await loadCart();
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, [supabase, loadCart]);

  const removeItem = useCallback(async (cartItemId: string) => {
    return updateQuantity(cartItemId, 0);
  }, [updateQuantity]);

  const clearCart = useCallback(async () => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;

      setCartItems([]);
      setIsLoading(false);
      setError(null);
      setTotalAmount(0);
      setTotalItems(0);

      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, [supabase, user]);

  const getItemInCart = useCallback((productId: string) => {
    return cartItems.find(item => item.product_id === productId);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      isLoading,
      error,
      totalAmount,
      totalItems,
      getItemInCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart: loadCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
