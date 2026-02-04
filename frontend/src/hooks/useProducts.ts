'use client';

import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface ProductSearchResult {
  id: number;
  sku: string;
  slug: string;
  name_ru: string;
  name_kk: string;
  description_short_ru: string | null;
  brand: string | null;
  price: number;
  old_price: number | null;
  stock_quantity: number;
  category_id: number | null;
  primary_image_url: string | null;
  is_featured: boolean;
  relevance_score: number;
  total_count: number;
}

interface ProductDetail {
  id: number;
  sku: string;
  slug: string;
  name_ru: string;
  name_kk: string;
  description_short_ru: string | null;
  description_short_kk: string | null;
  description_full_ru: string | null;
  description_full_kk: string | null;
  brand: string | null;
  price: number;
  old_price: number | null;
  stock_quantity: number;
  category_id: number | null;
  category_name_ru: string | null;
  is_featured: boolean;
}

interface SimilarProduct {
  id: number;
  slug: string;
  name_ru: string;
  price: number;
  primary_image_url: string | null;
}

interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

interface ProductAttribute {
  id: number;
  product_id: number;
  attribute_name_ru: string;
  attribute_name_kk: string;
  attribute_value_ru: string;
  attribute_value_kk: string;
  sort_order: number;
}

interface SearchParams {
  query?: string;
  categoryId?: number;
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

  // Поиск товаров
  const searchProducts = useCallback(async (params: SearchParams = {}) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await supabase.rpc('search_products', {
      search_query: params.query || null,
      category_filter: params.categoryId || null,
      brand_filter: params.brand || null,
      min_price: params.minPrice || null,
      max_price: params.maxPrice || null,
      in_stock_only: params.inStockOnly || false,
      sort_by: params.sortBy || 'relevance',
      page_number: params.page || 1,
      page_size: params.pageSize || 20,
    });

    if (error) {
      // Если пользователь не авторизован или не взрослый
      if (error.message.includes('Access denied') || error.message.includes('user must be 18+')) {
        setState(prev => ({
          ...prev,
          products: [],
          isLoading: false,
          error: 'ACCESS_DENIED',
          totalCount: 0,
        }));
        return { success: false, error: 'ACCESS_DENIED' };
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { success: false, error: error.message };
    }

    const products = (data || []) as ProductSearchResult[];
    const totalCount = products[0]?.total_count || 0;

    setState({
      products,
      isLoading: false,
      error: null,
      totalCount: Number(totalCount),
      currentPage: params.page || 1,
      pageSize: params.pageSize || 20,
    });

    return { success: true, data: products };
  }, [supabase]);

  // Получение товара по slug
  const getProductBySlug = useCallback(async (slug: string) => {
    const { data, error } = await supabase.rpc('get_product_by_slug', {
      product_slug: slug,
    });

    if (error) {
      if (error.message.includes('Access denied')) {
        return { success: false, error: 'ACCESS_DENIED' };
      }
      return { success: false, error: error.message };
    }

    const product = (data as ProductDetail[])?.[0] || null;
    return { success: true, data: product };
  }, [supabase]);

  // Получение изображений товара
  const getProductImages = useCallback(async (productId: number) => {
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
  const getProductAttributes = useCallback(async (productId: number) => {
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

  // Получение похожих товаров
  const getSimilarProducts = useCallback(async (productId: number, limit: number = 4) => {
    const { data, error } = await supabase.rpc('get_similar_products', {
      product_id_param: productId,
      limit_count: limit,
    });

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
      getSimilarProducts(productResult.data.id),
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
