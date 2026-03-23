'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFavorites([]);
        setProductIds(new Set());
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data: favData, error: favError } = await supabase
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
        setFavorites([]);
        setProductIds(new Set());
        setIsLoading(false);
        setError(null);
        return;
      }

      const items = ((favData || []) as unknown as FavoriteItem[]).map(item => ({
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
      }));
      const idSet = new Set(items.map(f => f.product_id));

      setFavorites(items);
      setProductIds(idSet);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      setError(null);
    }
  }, [supabase]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback((productId: string) => {
    return productIds.has(productId);
  }, [productIds]);

  const toggleFavorite = useCallback(async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

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
          .eq('user_id', session.user.id)
          .eq('product_id', productId);

        if (error) {
          // Откат при ошибке
          await loadFavorites();
          throw error;
        }
        return { success: true, action: 'removed' as const };
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: session.user.id,
            product_id: productId,
          });

        if (error) {
          // Откат при ошибке
          await loadFavorites();
          throw error;
        }
        // Перезагружаем для получения полных данных продукта
        await loadFavorites();
        return { success: true, action: 'added' as const };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
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
