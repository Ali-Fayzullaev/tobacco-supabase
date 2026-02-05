'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  productId: string;
  initialData?: {
    rating: number;
    title: string;
    comment: string;
    pros: string;
    cons: string;
  };
  onSubmit: (data: {
    product_id: string;
    rating: number;
    title?: string;
    comment?: string;
    pros?: string;
    cons?: string;
  }) => Promise<boolean>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ReviewForm({ 
  productId, 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading 
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(initialData?.title || '');
  const [comment, setComment] = useState(initialData?.comment || '');
  const [pros, setPros] = useState(initialData?.pros || '');
  const [cons, setCons] = useState(initialData?.cons || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку');
      return;
    }

    const success = await onSubmit({
      product_id: productId,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined,
      pros: pros.trim() || undefined,
      cons: cons.trim() || undefined,
    });

    if (success) {
      // Сбрасываем форму при успешной отправке
      if (!initialData) {
        setRating(0);
        setTitle('');
        setComment('');
        setPros('');
        setCons('');
      }
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Ужасно';
      case 2: return 'Плохо';
      case 3: return 'Нормально';
      case 4: return 'Хорошо';
      case 5: return 'Отлично';
      default: return 'Выберите оценку';
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">
          {initialData ? 'Редактировать отзыв' : 'Оставить отзыв'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ваша оценка *
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= (hoveredRating || rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {getRatingText(hoveredRating || rating)}
              </span>
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок отзыва
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Кратко опишите впечатление"
              className="bg-gray-50 border-gray-200"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите подробнее о вашем опыте использования товара..."
              className="w-full min-h-[120px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
              maxLength={1000}
            />
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👍 Достоинства
              </label>
              <textarea
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                placeholder="Что понравилось?"
                className="w-full min-h-[80px] px-3 py-2 bg-green-50 border border-green-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300"
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👎 Недостатки
              </label>
              <textarea
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                placeholder="Что не понравилось?"
                className="w-full min-h-[80px] px-3 py-2 bg-red-50 border border-red-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                maxLength={500}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 gap-2"
            >
              <Send className="h-4 w-4" />
              {initialData ? 'Сохранить' : 'Отправить отзыв'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="border-gray-200"
              >
                Отмена
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
