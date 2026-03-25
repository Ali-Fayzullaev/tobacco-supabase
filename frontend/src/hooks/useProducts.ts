'use client';

import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export interface ProductSearchResult {
  id: string;
  sku: string | null;
  slug: string;
  name: string;
  name_kk: string | null;
  description: string | null;
  brand: string | null;
  price: number;
  old_price: number | null;
  in_stock: boolean;
  category_id: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  stock?: number;
  order_step?: number;
  rating?: number;
  reviews_count?: number;
}

interface ProductDetail {
  id: string;
  sku: string | null;
  slug: string;
  name: string;
  name_kk: string | null;
  description: string | null;
  description_kk: string | null;
  brand: string | null;
  price: number;
  old_price: number | null;
  in_stock: boolean;
  is_active: boolean;
  category_id: string | null;
  category_name: string | null;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface SimilarProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface ProductAttribute {
  id: string;
  product_id: string;
  name: string;
  value: string;
  sort_order: number;
}

interface SearchParams {
  query?: string;
  categoryId?: string;
  categoryIds?: string[];
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
  page?: number;
  pageSize?: number;
}

interface ProductsState {
  products: ProductSearchResult[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export function useProducts() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<ProductsState>({
    products: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
  });

  // Поиск товаров (простой запрос без RPC)
  const searchProducts = useCallback(async (params: SearchParams = {}) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const pageSize = params.pageSize || 20;
      const page = params.page || 1;
      const offset = (page - 1) * pageSize;

      // Простой запрос - только базовые поля
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Фильтр по категории (одна или несколько)
      if (params.categoryIds && params.categoryIds.length > 0) {
        query = query.in('category_id', params.categoryIds);
      } else if (params.categoryId) {
        query = query.eq('category_id', params.categoryId);
      }

      // Фильтр по бренду
      if (params.brand) {
        query = query.eq('brand', params.brand);
      }

      // Фильтр по цене
      if (params.minPrice) {
        query = query.gte('price', params.minPrice);
      }
      if (params.maxPrice) {
        query = query.lte('price', params.maxPrice);
      }

      // Фильтр по наличию
      if (params.inStockOnly) {
        query = query.eq('in_stock', true);
      }

      // Поиск по тексту
      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,name_kk.ilike.%${params.query}%,brand.ilike.%${params.query}%`);
      }

      // Сортировка
      switch (params.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Пагинация
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Обрабатываем данные
      const products: ProductSearchResult[] = (data || []).map((item: any) => ({
        id: item.id,
        sku: item.sku || null,
        slug: item.slug,
        name: item.name,
        name_kk: item.name_kk,
        description: item.description,
        brand: item.brand,
        price: item.price,
        old_price: item.old_price,
        in_stock: item.in_stock ?? true,
        category_id: item.category_id,
        image_url: item.image_url || null,
        is_featured: item.is_featured || false,
        is_new: item.is_new || false,
        is_bestseller: item.is_bestseller || false,
        stock: item.stock ?? undefined,
        order_step: item.order_step ?? 1,
        rating: item.rating || 0,
        reviews_count: item.reviews_count || 0,
      }));

      setState({
        products,
        isLoading: false,
        error: null,
        totalCount: count || 0,
        currentPage: page,
        pageSize,
      });

      return { success: true, data: products };
    } catch (error: any) {
      console.error('[useProducts] searchProducts error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { success: false, error: error.message };
    }
  }, [supabase]);

  // Получение товара по slug (прямой запрос)
  const getProductBySlug = useCallback(async (slug: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name, name_kk)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const product = data ? {
      ...data,
      category_name: data.category?.name || null,
    } : null;

    return { success: true, data: product as ProductDetail };
  }, [supabase]);

  // Получение изображений товара
  const getProductImages = useCallback(async (productId: string) => {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ProductImage[] };
  }, [supabase]);

  // Получение атрибутов товара
  const getProductAttributes = useCallback(async (productId: string) => {
    const { data, error } = await supabase
      .from('product_attributes')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ProductAttribute[] };
  }, [supabase]);

  // Получение похожих товаров (по категории)
  const getSimilarProducts = useCallback(async (productId: string, categoryId: string | null, limit: number = 4) => {
    if (!categoryId) {
      return { success: true, data: [] as SimilarProduct[] };
    }

    const { data, error } = await supabase
      .from('products')
      .select('id, slug, name, price, image_url')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', productId)
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SimilarProduct[] };
  }, [supabase]);

  // Полная загрузка товара с картинками и атрибутами
  const getFullProduct = useCallback(async (slug: string) => {
    const productResult = await getProductBySlug(slug);
    
    if (!productResult.success || !productResult.data) {
      return productResult;
    }

    const [imagesResult, attributesResult, similarResult] = await Promise.all([
      getProductImages(productResult.data.id),
      getProductAttributes(productResult.data.id),
      getSimilarProducts(productResult.data.id, productResult.data.category_id),
    ]);

    return {
      success: true,
      data: {
        ...productResult.data,
        images: imagesResult.data || [],
        attributes: attributesResult.data || [],
        similar: similarResult.data || [],
      },
    };
  }, [getProductBySlug, getProductImages, getProductAttributes, getSimilarProducts]);

  return {
    ...state,
    searchProducts,
    getProductBySlug,
    getProductImages,
    getProductAttributes,
    getSimilarProducts,
    getFullProduct,
  };
}
