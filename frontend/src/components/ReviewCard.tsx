'use client';

import { useState } from 'react';
import { Star, ThumbsUp, User, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProductReview, ReviewStats } from '@/hooks/useReviews';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  review: ProductReview;
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHelpful?: () => void;
}

export function ReviewCard({ review, isOwn, onEdit, onDelete, onHelpful }: ReviewCardProps) {
  const userName = review.user_profile?.first_name 
    ? `${review.user_profile.first_name} ${review.user_profile.last_name || ''}`.trim()
    : 'Пользователь';
  
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-sm">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gold-500/10 text-gold-500">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#F5F5F5]">{userName}</span>
                {review.is_verified_purchase && (
                  <Badge variant="success" className="text-xs gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Покупатель
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[#A0A0A0]">{formatDate(review.created_at)}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= review.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        {review.title && (
          <h4 className="font-semibold text-[#F5F5F5] mb-2">{review.title}</h4>
        )}

        {/* Comment */}
        {review.comment && (
          <p className="text-[#A0A0A0] mb-4">{review.comment}</p>
        )}

        {/* Pros & Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {review.pros && (
            <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30">
              <p className="text-sm font-medium text-green-400 mb-1">👍 Достоинства</p>
              <p className="text-sm text-green-300/80">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/30">
              <p className="text-sm font-medium text-red-400 mb-1">👎 Недостатки</p>
              <p className="text-sm text-red-300/80">{review.cons}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2A2A2A]">
          <button
            onClick={onHelpful}
            className="flex items-center gap-2 text-sm text-[#A0A0A0] hover:text-gold-500 transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>Полезно ({review.helpful_count})</span>
          </button>

          {isOwn && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1 text-[#A0A0A0]">
                <Edit2 className="h-4 w-4" />
                Изменить
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ReviewStatsProps {
  stats: ReviewStats;
}

export function ReviewStatsCard({ stats }: ReviewStatsProps) {
  const maxCount = Math.max(...Object.values(stats.rating_distribution), 1);

  return (
    <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-[#F5F5F5]">
              {stats.average_rating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-5 w-5",
                    star <= Math.round(stats.average_rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-[#A0A0A0]">
              {stats.total_reviews} {getReviewWord(stats.total_reviews)}
            </p>
          </div>

          {/* Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution];
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-8">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-[#A0A0A0]">{rating}</span>
                  </div>
                  <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-[#A0A0A0] w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getReviewWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'отзывов';
  if (lastOne === 1) return 'отзыв';
  if (lastOne >= 2 && lastOne <= 4) return 'отзыва';
  return 'отзывов';
}
