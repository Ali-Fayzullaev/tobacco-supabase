'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Eye, Lock, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPrice, cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price?: number | null;
  image_url?: string | null;
  brand?: string | null;
  in_stock: boolean;
  stock?: number;
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  rating?: number;
  reviews_count?: number;
}

interface ProductCardProps {
  product: Product;
  size?: 'compact' | 'normal' | 'comfortable';
  className?: string;
  showPrice?: boolean;
}

export function ProductCard({ product, size = 'normal', className, showPrice = true }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite, isLoading: isFavLoading } = useFavorites();
  const isFav = isFavorite(product.id);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const discount = product.old_price 
    ? Math.round((1 - product.price / product.old_price) * 100) 
    : 0;

  const rating = product.rating || 0;
  const reviewsCount = product.reviews_count || 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingToCart) return;
    setAddingToCart(true);
    setAddedToCart(false);
    try {
      const result = await addToCart(product.id, 1);
      if (result.success) {
        setAddedToCart(true);
        toast.success(`${product.name} добавлен в корзину`);
        setTimeout(() => setAddedToCart(false), 1500);
      } else {
        toast.error(result.error || 'Не удалось добавить товар');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  // Стили в зависимости от размера
  const sizeStyles = {
    compact: {
      padding: 'p-2 sm:p-3',
      imageHeight: 'h-28 sm:h-32',
      titleSize: 'text-xs sm:text-sm',
      titleLines: 'line-clamp-2',
      priceSize: 'text-sm sm:text-base',
      oldPriceSize: 'text-[10px] sm:text-xs',
      badgeSize: 'text-[9px] px-1.5 py-0',
      buttonSize: 'h-7 sm:h-8 text-[10px] sm:text-xs',
      iconSize: 'h-3 w-3 sm:h-3.5 sm:w-3.5',
      showBrand: false,
      showRating: true,
      starSize: 'h-2.5 w-2.5',
      showDiscount: true,
      favBtnSize: 'p-1 sm:p-1.5',
      favIconSize: 'h-3 w-3 sm:h-4 sm:w-4',
    },
    normal: {
      padding: 'p-3 sm:p-4',
      imageHeight: 'h-36 sm:h-44',
      titleSize: 'text-sm sm:text-base',
      titleLines: 'line-clamp-2',
      priceSize: 'text-base sm:text-lg',
      oldPriceSize: 'text-xs sm:text-sm',
      badgeSize: 'text-[10px] sm:text-xs px-2 py-0.5',
      buttonSize: 'h-8 sm:h-9 text-xs sm:text-sm',
      iconSize: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
      showBrand: true,
      showRating: true,
      starSize: 'h-3 w-3',
      showDiscount: true,
      favBtnSize: 'p-1.5 sm:p-2',
      favIconSize: 'h-4 w-4',
    },
    comfortable: {
      padding: 'p-4 sm:p-5',
      imageHeight: 'h-44 sm:h-56',
      titleSize: 'text-sm sm:text-lg',
      titleLines: 'line-clamp-2',
      priceSize: 'text-lg sm:text-xl',
      oldPriceSize: 'text-sm',
      badgeSize: 'text-xs px-2.5 py-0.5',
      buttonSize: 'h-9 sm:h-10 text-sm',
      starSize: 'h-3.5 w-3.5',
      iconSize: 'h-4 w-4',
      showBrand: true,
      showRating: true,
      showDiscount: true,
      favBtnSize: 'p-2',
      favIconSize: 'h-5 w-5',
    },
  };

  const s = sizeStyles[size];

  return (
    <Link href={`/product/${product.slug}`}>
      <div className={cn(
        "group bg-white rounded-xl border border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full",
        !product.in_stock && "opacity-70",
        className
      )}>
        {/* Image Container */}
        <div className="relative flex-shrink-0">
          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {product.is_new && (
              <Badge className={cn("bg-teal-500 hover:bg-teal-600 text-white", s.badgeSize)}>
                Новинка
              </Badge>
            )}
            {product.is_bestseller && (
              <Badge className={cn("bg-orange-500 hover:bg-orange-600 text-white", s.badgeSize)}>
                Хит
              </Badge>
            )}
            {discount > 0 && (
              <Badge className={cn("bg-red-500 hover:bg-red-600 text-white", s.badgeSize)}>
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Favorite button - Top Right */}
          <button
            onClick={handleToggleFavorite}
            disabled={isFavLoading}
            className={cn(
              "absolute top-2 right-2 z-10 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110",
              s.favBtnSize,
              isFav ? "text-red-500" : "text-gray-400 hover:text-red-500"
            )}
          >
            <Heart className={cn(s.favIconSize, isFav && "fill-current")} />
          </button>

          {/* Image */}
          <div className={cn("relative bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden", s.imageHeight)}>
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ShoppingCart className="h-10 w-10" />
              </div>
            )}
            
            {!product.in_stock && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <span className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                  Нет в наличии
                </span>
              </div>
            )}

            {product.in_stock && product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  Осталось {product.stock} шт.
                </span>
              </div>
            )}

            {/* Quick View on Hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                <Eye className="h-3 w-3 inline mr-1" />
                Просмотр
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={cn("flex-1 flex flex-col", s.padding)}>
          {/* Brand */}
          {s.showBrand && product.brand && (
            <span className="text-[10px] sm:text-xs text-teal-600 font-medium uppercase tracking-wide mb-1">
              {product.brand}
            </span>
          )}

          {/* Name */}
          <h3 className={cn(
            "font-medium text-gray-900 group-hover:text-orange-600 transition-colors flex-grow",
            s.titleSize,
            s.titleLines
          )}>
            {product.name}
          </h3>

          {/* Rating */}
          {s.showRating && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      s.starSize || "h-3 w-3",
                      star <= Math.round(rating) 
                        ? "text-amber-400 fill-amber-400" 
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500 ml-1">
                {reviewsCount > 0 ? `(${reviewsCount})` : 'Нет отзывов'}
              </span>
            </div>
          )}

          {/* Price Block */}
          <div className="mt-auto pt-2">
            {showPrice ? (
              <>
                {/* Old Price */}
                {product.old_price && s.showDiscount && (
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-gray-400 line-through", s.oldPriceSize)}>
                      {formatPrice(product.old_price)}
                    </span>
                  </div>
                )}
                
                {/* Current Price */}
                <div className={cn("font-bold text-orange-600", s.priceSize)}>
                  {formatPrice(product.price)}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400 italic">
                Войдите (18+) для просмотра цен
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          {showPrice ? (
            <Button
              onClick={handleAddToCart}
              disabled={!product.in_stock || addingToCart}
              className={cn(
                "w-full mt-2 font-medium transition-all",
                addedToCart
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white",
                s.buttonSize
              )}
            >
              {addingToCart ? (
                <Loader2 className={cn(s.iconSize, "mr-1.5 animate-spin")} />
              ) : addedToCart ? (
                <Check className={cn(s.iconSize, "mr-1.5")} />
              ) : (
                <ShoppingCart className={cn(s.iconSize, "mr-1.5")} />
              )}
              {addingToCart ? 'Добавляем...' : addedToCart ? 'Добавлено!' : 'В корзину'}
            </Button>
          ) : (
            <Link href="/login" className="w-full">
              <Button
                variant="outline"
                className={cn(
                  "w-full mt-2 border-orange-300 text-orange-600 hover:bg-orange-50 font-medium",
                  s.buttonSize
                )}
              >
                Войти
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Link>
  );
}

// Компактная карточка для списка
export function ProductCardCompact({ product, showPrice = true }: { product: Product; showPrice?: boolean }) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(product.id);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const discount = product.old_price 
    ? Math.round((1 - product.price / product.old_price) * 100) 
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (addingToCart) return;
    setAddingToCart(true);
    setAddedToCart(false);
    try {
      const result = await addToCart(product.id, 1);
      if (result.success) {
        setAddedToCart(true);
        toast.success(`${product.name} добавлен в корзину`);
        setTimeout(() => setAddedToCart(false), 1500);
      } else {
        toast.error(result.error || 'Не удалось добавить товар');
      }
    } finally {
      setAddingToCart(false);
    }
  };
  
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="flex-shrink-0">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-lg overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-1.5"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          )}
          {discount > 0 && (
            <Badge className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] px-1 py-0">
              -{discount}%
            </Badge>
          )}
        </div>
      </Link>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-1 hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating */}
        <div className="flex items-center gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-2.5 w-2.5 sm:h-3 sm:w-3",
                star <= Math.round(product.rating || 0) 
                  ? "text-amber-400 fill-amber-400" 
                  : "text-gray-200"
              )}
            />
          ))}
        </div>
        
        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1">
          {showPrice ? (
            <>
              <span className="text-base sm:text-lg font-bold text-orange-600">
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">Войдите (18+)</span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.id);
          }}
          className={cn(
            "p-2 rounded-lg border transition-colors",
            isFav 
              ? "border-red-200 bg-red-50 text-red-500" 
              : "border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"
          )}
        >
          <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
        </button>
        {showPrice ? (
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.in_stock || addingToCart}
            className={cn(
              "h-9 px-3 transition-all",
              addedToCart
                ? "bg-green-500 hover:bg-green-600"
                : "bg-orange-500 hover:bg-orange-600"
            )}
          >
            {addingToCart ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : addedToCart ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Link href="/login">
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 h-9 px-3">
              <Lock className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
