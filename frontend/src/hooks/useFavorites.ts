'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface FavoriteItem {
  id: number;
  product_id: number;
  created_at: string;
  product: {
    id: number;
    slug: string;
    name_ru: string;
    name_kk: string;
    price: number;
    old_price: number | null;
    stock_quantity: number;
    primary_image_url?: string;
  };
}

interface FavoritesState {
  items: FavoriteItem[];
  productIds: Set<number>;
  isLoading: boolean;
  error: string | null;
}

export function useFavorites() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<FavoritesState>({
    items: [],
    productIds: new Set(),
    isLoading: true,
    error: null,
  });

  // Загрузка избранного
  const loadFavorites = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Получаем избранное с информацией о товарах
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false });

    if (favError) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: favError.message,
      }));
      return;
    }

    if (!favorites || favorites.length === 0) {
      setState({
        items: [],
        productIds: new Set(),
        isLoading: false,
        error: null,
      });
      return;
    }

    // Получаем информацию о товарах
    const productIds = favorites.map(f => f.product_id);
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select(`
        id,
        slug,
        name_ru,
        name_kk,
        price,
        old_price,
        stock_quantity
      `)
      .in('id', productIds)
      .eq('is_active', true)
      .eq('is_deleted', false);

    if (prodError) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: prodError.message,
      }));
      return;
    }

    // Получаем изображения
    const { data: images } = await supabase
      .from('product_images')
      .select('product_id, image_url')
      .in('product_id', productIds)
      .eq('is_primary', true);

    const imageMap = new Map(images?.map(img => [img.product_id, img.image_url]) || []);

    // Собираем данные
    const items: FavoriteItem[] = favorites
      .map(fav => {
        const product = products?.find(p => p.id === fav.product_id);
        if (!product) return null;

        return {
          id: fav.id,
          product_id: fav.product_id,
          created_at: fav.created_at,
          product: {
            ...product,
            primary_image_url: imageMap.get(product.id) || undefined,
          },
        };
      })
      .filter((item): item is FavoriteItem => item !== null);

    setState({
      items,
      productIds: new Set(productIds),
      isLoading: false,
      error: null,
    });
  }, [supabase]);

  // Загрузка при монтировании
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Переключение избранного
  const toggleFavorite = async (productId: number) => {
    const { data, error } = await supabase.rpc('toggle_favorite', {
      product_id_param: productId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; action: 'added' | 'removed' };

    if (result.success) {
      await loadFavorites();
    }

    return result;
  };

  // Проверка, есть ли товар в избранном
  const isFavorite = (productId: number) => {
    return state.productIds.has(productId);
  };

  return {
    ...state,
    toggleFavorite,
    isFavorite,
    refreshFavorites: loadFavorites,
  };
}
