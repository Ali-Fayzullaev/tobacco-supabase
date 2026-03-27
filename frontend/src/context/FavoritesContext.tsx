'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { getSupabaseBrowserClient, getPublicSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { withRetry } from '@/lib/utils';

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

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  productIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  toggleFavorite: (productId: string) => Promise<{ success: boolean; error?: string; action?: 'added' | 'removed' }>;
  isFavorite: (productId: string) => boolean;
  loadFavorites: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const publicSupabase = getPublicSupabaseClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Защита от гонки: отменяем устаревшие загрузки
  const loadIdRef = useRef(0);
  // Стабильная ссылка на user.id — не вызывает пересоздание useCallback при TOKEN_REFRESHED
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  const loadFavorites = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) {
      setFavorites([]);
      setProductIds(new Set());
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentLoadId = ++loadIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const { data: favData, error: favError } = await withRetry(() =>
        supabase
          .from('favorites')
          .select('id, product_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      );

      // Если запрос устарел (запущен новый loadFavorites) — игнорируем
      if (currentLoadId !== loadIdRef.current) return;

      if (favError) {
        console.warn('[Favorites] Ошибка загрузки:', favError.message);
        // НЕ очищаем избранное при ошибке — сохраняем старые данные
        setIsLoading(false);
        setError('Не удалось загрузить избранное');
        return;
      }

      if (!favData || favData.length === 0) {
        setFavorites([]);
        setProductIds(new Set());
        setIsLoading(false);
        setError(null);
        return;
      }

      const favProductIds = favData.map(f => f.product_id);

      // Товары — публичные данные, загружаем через анонимный клиент
      const { data: productsData, error: productsError } = await withRetry(() =>
        publicSupabase
          .from('products')
          .select('id, slug, name, name_kk, price, old_price, in_stock, image_url, brand')
          .in('id', favProductIds)
      );

      if (currentLoadId !== loadIdRef.current) return;

      if (productsError) {
        console.warn('[Favorites] Ошибка загрузки товаров:', productsError.message);
        setIsLoading(false);
        setError('Не удалось загрузить данные товаров');
        return;
      }

      const productsMap = new Map(
        (productsData || []).map((p: FavoriteItem['product']) => [p.id, p])
      );

      const items: FavoriteItem[] = favData
        .map(fav => {
          const product = productsMap.get(fav.product_id);
          if (!product) return null;
          return {
            id: fav.id,
            product_id: fav.product_id,
            created_at: fav.created_at,
            product,
          };
        })
        .filter((item): item is FavoriteItem => item !== null);
      const idSet = new Set(items.map(f => f.product_id));

      setFavorites(items);
      setProductIds(idSet);
      setIsLoading(false);
      setError(null);
    } catch (e: unknown) {
      if (currentLoadId !== loadIdRef.current) return;
      console.warn('[Favorites] Исключение при загрузке:', e instanceof Error ? e.message : e);
      // Сохраняем старые данные, не очищаем
      setIsLoading(false);
      setError('Ошибка загрузки избранного');
    }
  }, [supabase, publicSupabase]); // НЕ зависит от user — использует userIdRef

  // Загружаем когда auth готов или user сменился
  useEffect(() => {
    if (!isAuthLoading) loadFavorites();
  }, [isAuthLoading, user?.id, loadFavorites]);

  const isFavorite = useCallback((productId: string) => {
    return productIds.has(productId);
  }, [productIds]);

  const toggleFavorite = useCallback(async (productId: string) => {
    const userId = userIdRef.current;
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const isInFavorites = productIds.has(productId);

      // Оптимистичное обновление — мгновенно обновляем UI
      if (isInFavorites) {
        setProductIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        setFavorites(prev => prev.filter(f => f.product_id !== productId));
      } else {
        setProductIds(prev => new Set(prev).add(productId));
      }

      if (isInFavorites) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);

        if (error) {
          await loadFavorites();
          throw error;
        }
        return { success: true, action: 'removed' as const };
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: userId,
            product_id: productId,
          });

        if (error) {
          await loadFavorites();
          throw error;
        }
        await loadFavorites();
        return { success: true, action: 'added' as const };
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
    }
  }, [supabase, productIds, loadFavorites]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      productIds,
      isLoading,
      error,
      toggleFavorite,
      isFavorite,
      loadFavorites,
      refreshFavorites: loadFavorites,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
