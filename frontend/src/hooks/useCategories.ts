'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Category } from '@/lib/types';

interface CategoriesState {
  categories: Category[];
  parentCategories: Category[];
  isLoading: boolean;
  error: string | null;
}

export function useCategories() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<CategoriesState>({
    categories: [],
    parentCategories: [],
    isLoading: true,
    error: null,
  });

  // Загрузка категорий
  const loadCategories = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('[useCategories] error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.code === 'PGRST301' ? 'ACCESS_DENIED' : error.message,
        }));
        return;
      }

      const categories = (data || []) as Category[];
      const parentCategories = categories.filter(c => !c.parent_id);

      setState({
        categories,
        parentCategories,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      console.error('[useCategories] unexpected error:', e);
      setState({ categories: [], parentCategories: [], isLoading: false, error: 'Unexpected error' });
    }
  }, [supabase]);

  // Загрузка при монтировании
  useEffect(() => {
    loadCategories();
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
    refreshCategories: loadCategories,
  };
}
