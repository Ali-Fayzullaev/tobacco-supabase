'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPublicSupabaseClient } from '@/lib/supabase';
import { Category } from '@/lib/types';

interface CategoriesState {
  categories: Category[];
  parentCategories: Category[];
  isLoading: boolean;
  error: string | null;
}

// Дедупликация: один fetch на всё приложение (Header + Catalog используют одновременно)
let _cachedCategories: Category[] | null = null;
let _fetchPromise: Promise<Category[]> | null = null;

async function fetchCategoriesOnce(supabase: ReturnType<typeof getPublicSupabaseClient>): Promise<Category[]> {
  if (_cachedCategories) return _cachedCategories;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    _cachedCategories = (data || []) as Category[];
    _fetchPromise = null;
    return _cachedCategories;
  })();

  return _fetchPromise;
}

export function useCategories() {
  // Анонимный клиент — категории публичные, не зависят от авторизации
  const supabase = getPublicSupabaseClient();
  const [state, setState] = useState<CategoriesState>({
    categories: _cachedCategories || [],
    parentCategories: _cachedCategories?.filter(c => !c.parent_id) || [],
    isLoading: !_cachedCategories,
    error: null,
  });
  const mountedRef = useRef(true);

  // Загрузка категорий
  const loadCategories = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const categories = await fetchCategoriesOnce(supabase);
      if (!mountedRef.current) return;
      const parentCategories = categories.filter(c => !c.parent_id);
      setState({ categories, parentCategories, isLoading: false, error: null });
    } catch (e: any) {
      if (!mountedRef.current) return;
      console.error('[useCategories] error:', e);
      setState({ categories: [], parentCategories: [], isLoading: false, error: e.message || 'Unexpected error' });
    }
  }, [supabase]);

  // Загрузка при монтировании
  useEffect(() => {
    mountedRef.current = true;
    if (!_cachedCategories) loadCategories();
    return () => { mountedRef.current = false; };
  }, [loadCategories]);

  // Получить подкатегории
  const getSubcategories = useCallback((parentId: string) => {
    return state.categories.filter(c => c.parent_id === parentId);
  }, [state.categories]);

  // Получить категорию по slug
  const getCategoryBySlug = useCallback((slug: string) => {
    return state.categories.find(c => c.slug === slug) || null;
  }, [state.categories]);

  // Получить категорию по id
  const getCategoryById = useCallback((id: string) => {
    return state.categories.find(c => c.id === id) || null;
  }, [state.categories]);

  // Получить хлебные крошки для категории
  const getBreadcrumbs = useCallback((categoryId: string): Category[] => {
    const breadcrumbs: Category[] = [];
    let current = getCategoryById(categoryId);

    while (current) {
      breadcrumbs.unshift(current);
      current = current.parent_id ? getCategoryById(current.parent_id) : null;
    }

    return breadcrumbs;
  }, [getCategoryById]);

  return {
    ...state,
    getSubcategories,
    getCategoryBySlug,
    getCategoryById,
    getBreadcrumbs,
    refreshCategories: useCallback(async () => {
      _cachedCategories = null;
      _fetchPromise = null;
      await loadCategories();
    }, [loadCategories]),
  };
}
