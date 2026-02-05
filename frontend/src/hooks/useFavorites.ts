'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export interface FavoriteItem {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    slug: string;
    name: string;
    name_kk: string | null;
    price: number;
    old_price: number | null;
    in_stock: boolean;
    image_url: string | null;
    brand?: string | null;
  };
}

interface FavoritesState {
  favorites: FavoriteItem[];
  productIds: Set<string>;
  isLoading: boolean;
  error: string | null;
}

export function useFavorites() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<FavoritesState>({
    favorites: [],
    productIds: new Set(),
    isLoading: true,
    error: null,
  });

  // Загрузка избранного
  const loadFavorites = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({
          favorites: [],
          productIds: new Set(),
          isLoading: false,
          error: null,
        });
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Получаем избранное с информацией о товарах
      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          created_at,
          product:products(id, slug, name, name_kk, price, old_price, in_stock, image_url, brand)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (favError) {
        // Таблица может не существовать
        setState({
          favorites: [],
          productIds: new Set(),
          isLoading: false,
          error: null,
        });
        return;
      }

      const items = ((favorites || []) as unknown as FavoriteItem[]).map(item => ({
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
      }));
      const productIdSet = new Set(items.map(f => f.product_id));

      setState({
        favorites: items,
        productIds: productIdSet,
        isLoading: false,
        error: null,
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
    loadFavorites();
  }, [loadFavorites]);

  // Переключение избранного
  const toggleFavorite = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // Проверяем, есть ли уже в избранном
      const isInFavorites = state.productIds.has(productId);

      if (isInFavorites) {
        // Удаляем
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('product_id', productId);

        if (error) throw error;
        
        await loadFavorites();
        return { success: true, action: 'removed' as const };
      } else {
        // Добавляем
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: session.user.id,
            product_id: productId,
          });

        if (error) throw error;
        
        await loadFavorites();
        return { success: true, action: 'added' as const };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Проверка, есть ли товар в избранном
  const isFavorite = (productId: string) => {
    return state.productIds.has(productId);
  };

  return {
    ...state,
    toggleFavorite,
    isFavorite,
    loadFavorites,
    refreshFavorites: loadFavorites,
  };
}
