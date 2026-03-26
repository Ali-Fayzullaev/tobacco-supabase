'use client';

import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient, getPublicSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  pros: string | null;
  cons: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface CreateReviewData {
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
}

export function useReviews(productId?: string) {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();   // для записи (нужна авторизация)
  const publicSupabase = getPublicSupabaseClient(); // для чтения (публичные данные)
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<ProductReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка отзывов для продукта
  const fetchReviews = useCallback(async (prodId?: string) => {
    const targetId = prodId || productId;
    if (!targetId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await publicSupabase
        .from('product_reviews')
        .select(`
          *,
          user_profile:profiles!product_reviews_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('product_id', targetId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReviews(data || []);

      // Если пользователь авторизован, проверяем его отзыв
      if (user) {
        const userRev = data?.find(r => r.user_id === user.id);
        setUserReview(userRev || null);
      }

      // Вычисляем статистику
      if (data && data.length > 0) {
        const totalRating = data.reduce((sum, r) => sum + r.rating, 0);
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        
        data.forEach(r => {
          if (r.rating >= 1 && r.rating <= 5) {
            distribution[r.rating as keyof typeof distribution]++;
          }
        });

        setStats({
          average_rating: totalRating / data.length,
          total_reviews: data.length,
          rating_distribution: distribution,
        });
      } else {
        setStats({
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Ошибка загрузки отзывов');
    } finally {
      setIsLoading(false);
    }
  }, [productId, user]);

  // Создание нового отзыва
  const createReview = useCallback(async (data: CreateReviewData): Promise<boolean> => {
    if (!user) {
      setError('Необходимо авторизоваться');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('product_reviews')
        .upsert({
          product_id: data.product_id,
          user_id: user.id,
          rating: data.rating,
          title: data.title || null,
          comment: data.comment || null,
          pros: data.pros || null,
          cons: data.cons || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'product_id,user_id'
        });

      if (insertError) {
        throw insertError;
      }

      // Перезагружаем отзывы
      await fetchReviews(data.product_id);
      return true;
    } catch (err) {
      console.error('Error creating review:', err);
      setError('Ошибка при создании отзыва');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchReviews]);

  // Обновление отзыва
  const updateReview = useCallback(async (
    reviewId: string, 
    data: Partial<CreateReviewData>
  ): Promise<boolean> => {
    if (!user) {
      setError('Необходимо авторизоваться');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('product_reviews')
        .update({
          rating: data.rating,
          title: data.title || null,
          comment: data.comment || null,
          pros: data.pros || null,
          cons: data.cons || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchReviews();
      return true;
    } catch (err) {
      console.error('Error updating review:', err);
      setError('Ошибка при обновлении отзыва');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchReviews]);

  // Удаление отзыва
  const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!user) {
      setError('Необходимо авторизоваться');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchReviews();
      return true;
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Ошибка при удалении отзыва');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchReviews]);

  // Отметка отзыва как полезного
  const markAsHelpful = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!user) {
      setError('Необходимо авторизоваться');
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('review_helpful')
        .insert({
          review_id: reviewId,
          user_id: user.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          // Уже отмечено - убираем отметку
          await supabase
            .from('review_helpful')
            .delete()
            .eq('review_id', reviewId)
            .eq('user_id', user.id);
        } else {
          throw insertError;
        }
      }

      await fetchReviews();
      return true;
    } catch (err) {
      console.error('Error marking review as helpful:', err);
      return false;
    }
  }, [user, fetchReviews]);

  return {
    reviews,
    stats,
    userReview,
    isLoading,
    error,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    markAsHelpful,
  };
}
