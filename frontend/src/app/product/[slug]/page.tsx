'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Check,
  Truck,
  Shield,
  Package,
  Star,
  Share2,
  Zap,
  MessageSquare
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewCard } from '@/components/ReviewCard';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useReviews } from '@/hooks/useReviews';
import { formatPrice, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProductFull, ProductImage, ProductAttribute } from '@/lib/types';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { getFullProduct, isLoading: isProductLoading } = useProducts();
  const { addToCart, getItemInCart, updateQuantity, removeItem, isLoading: isCartLoading } = useCart();
  const { toggleFavorite, isFavorite, isLoading: isFavLoading } = useFavorites();

  const [product, setProduct] = useState<ProductFull | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  // Reviews hook - will be initialized after product loads
  const { 
    reviews, 
    stats, 
    userReview, 
    isLoading: isReviewsLoading,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    markAsHelpful
  } = useReviews(product?.id);

  const canBuy = !!user;

  useEffect(() => {
    if (!isAuthLoading && slug) {
      loadProduct();
    }
  }, [slug, isAuthLoading]);

  // Load reviews when product is loaded
  useEffect(() => {
    if (product?.id) {
      fetchReviews(product.id);
    }
  }, [product?.id]);

  const loadProduct = async () => {
    setProductLoading(true);
    const result = await getFullProduct(slug);
    if (result.success && result.data) {
      setProduct(result.data as unknown as ProductFull);
    }
    setProductLoading(false);
  };

  const handleAddToCart = async () => {
    if (product) {
      const result = await addToCart(product.id, quantity);
      if (result.success) {
        toast.success(`${product.name} добавлен в корзину`);
      } else {
        toast.error(result.error || 'Не удалось добавить товар');
      }
    }
  };

  const handleQuickBuy = async () => {
    if (product) {
      const result = await addToCart(product.id, quantity);
      if (result.success) {
        window.location.href = '/checkout';
      } else {
        toast.error(result.error || 'Не удалось добавить товар');
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (product) {
      await toggleFavorite(product.id);
    }
  };

  const images: { id: string; image_url: string; alt_text: string | null }[] = product?.images?.length 
    ? product.images 
    : [{ id: '1', image_url: product?.image_url || '', alt_text: product?.name || '' }];

  const discount = product?.old_price 
    ? Math.round((1 - product.price / product.old_price) * 100) 
    : 0;

  // Loading state
  if (isAuthLoading || productLoading) {
    return (
      <div className="min-h-screen bg-[#121212]">
        <Header />
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image skeleton */}
            <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] shadow-sm overflow-hidden">
              <div className="relative aspect-square bg-[#252525]">
                <Skeleton className="w-full h-full" />
              </div>
              <div className="p-4">
                <Skeleton className="rounded-md" style={{ height: 18, width: '60%' }} />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="rounded-md" style={{ height: 36, width: 96 }} />
                  <Skeleton className="rounded-md" style={{ height: 36, width: 72 }} />
                </div>
              </div>
            </div>

            {/* Info skeleton */}
            <div className="space-y-5">
              <Skeleton className="rounded-md" style={{ height: 28, width: '50%' }} />
              <Skeleton className="rounded-md" style={{ height: 18, width: 120 }} />
              <Skeleton className="rounded-md" style={{ height: 56, width: '100%' }} />

              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="rounded-md" style={{ height: 64 }} />
                <Skeleton className="rounded-md" style={{ height: 64 }} />
                <Skeleton className="rounded-md" style={{ height: 64 }} />
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-10">
            <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4">
              <Skeleton className="rounded-md" style={{ height: 20, width: '40%' }} />
              <div className="mt-4">
                <Skeleton className="rounded-md" style={{ height: 160, width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-[#1E1E1E] border-[#2A2A2A] shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] mb-4">Доступ ограничен</h1>
            <p className="text-[#A0A0A0] mb-6">
              Для просмотра товаров необходимо войти в систему.
            </p>
            <Link href={`/login?redirect=/product/${slug}`}>
              <Button className="w-full bg-gold-500 hover:bg-gold-600 text-white">
                Войти в аккаунт
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full bg-[#1E1E1E] border-[#2A2A2A] shadow-lg">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 flex items-center justify-center">
              <div className="w-40 h-40 bg-[#252525] rounded-md overflow-hidden">
                <Skeleton className="w-full h-full rounded-md" />
              </div>
            </div>
            <CardContent className="p-8 text-center md:text-left flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-[#F5F5F5] mb-4">Товар не найден</h1>
              <p className="text-[#A0A0A0] mb-6">
                Возможно, товар был удалён или перемещён.
              </p>
              <div className="mb-4">
                <Skeleton className="rounded-md mx-auto md:mx-0" style={{ height: 12, width: 200 }} />
              </div>
              <Link href="/catalog" className="w-full md:w-auto mx-auto md:mx-0">
                <Button className="w-full md:w-auto bg-gold-500 hover:bg-gold-600 text-white">
                  Перейти в каталог
                </Button>
              </Link>
            </CardContent>
          </div>
        </Card>
      </div>
    );
  }

  const isFav = isFavorite(product.id);
  const rating = stats?.average_rating || product.rating || 0;
  const reviewsCount = stats?.total_reviews || product.reviews_count || 0;

  // Handler for submitting a new review
  const handleSubmitReview = async (data: {
    product_id: string;
    rating: number;
    title?: string;
    comment?: string;
    pros?: string;
    cons?: string;
  }) => {
    const result = editingReview && userReview 
      ? await updateReview(userReview.id, data)
      : await createReview(data);
    
    if (result) {
      setShowReviewForm(false);
      setEditingReview(false);
      fetchReviews(product.id);
    }
    return result;
  };

  // Handler for deleting a review
  const handleDeleteReview = async () => {
    if (userReview) {
      const success = await deleteReview(userReview.id);
      if (success) {
        fetchReviews(product.id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-[#1E1E1E] border-b border-[#2A2A2A]">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-[#A0A0A0] hover:text-gold-600 transition-colors">
              Главная
            </Link>
            <ChevronRight className="h-4 w-4 text-[#666]" />
            <Link href="/catalog" className="text-[#A0A0A0] hover:text-gold-600 transition-colors">
              Каталог
            </Link>
            <ChevronRight className="h-4 w-4 text-[#666]" />
            <span className="text-[#F5F5F5] font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-sm overflow-hidden">
              <div className="relative aspect-square">
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {product.is_new && (
                    <Badge className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1">
                      Новинка
                    </Badge>
                  )}
                  {product.is_bestseller && (
                    <Badge className="bg-gold-500 hover:bg-gold-600 text-white px-3 py-1">
                      Хит продаж
                    </Badge>
                  )}
                  {discount > 0 && (
                    <Badge className="bg-red-900/200 hover:bg-red-600 text-white px-3 py-1">
                      -{discount}%
                    </Badge>
                  )}
                </div>

                {/* Favorite Button */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    disabled={isFavLoading}
                    className={cn(
                      "p-2.5 rounded-full shadow-sm transition-all hover:scale-110",
                      isFav 
                        ? "bg-red-900/20 text-red-500" 
                        : "bg-[#1E1E1E]/90 backdrop-blur-sm text-[#666] hover:text-red-500"
                    )}
                  >
                    <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
                  </button>
                </div>

                {images[selectedImageIndex]?.image_url ? (
                  <Image
                    src={images[selectedImageIndex].image_url}
                    alt={images[selectedImageIndex].alt_text || product.name}
                    fill
                    className="object-contain p-6"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-[#121212]">
                    <ShoppingCart className="h-20 w-20" />
                  </div>
                )}
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex(i => i > 0 ? i - 1 : images.length - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[#1E1E1E]/90 hover:bg-[#1E1E1E] rounded-full shadow-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#A0A0A0]" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-[#1E1E1E]/90 hover:bg-[#1E1E1E] rounded-full shadow-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-[#A0A0A0]" />
                    </button>
                  </>
                )}
              </div>
            </Card>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={cn(
                      "relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-[#1E1E1E]",
                      idx === selectedImageIndex 
                        ? 'border-gold-500 shadow-md' 
                        : 'border-[#2A2A2A] hover:border-gold-500/40'
                    )}
                  >
                    {img.image_url ? (
                      <Image
                        src={img.image_url}
                        alt={img.alt_text || ''}
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#252525]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {/* Brand */}
            {product.brand && (
              <Link href={`/catalog?brand=${product.brand}`}>
                <Badge variant="outline" className="border-gold-500/40 text-gold-500 hover:bg-gold-500/10">
                  {product.brand}
                </Badge>
              </Link>
            )}

            {/* Name */}
            <h1 className="text-2xl lg:text-3xl font-bold text-[#F5F5F5]">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-5 w-5",
                      star <= Math.round(rating) 
                        ? "text-amber-400 fill-amber-400" 
                        : "text-gray-200"
                    )}
                  />
                ))}
                <span className="ml-2 font-medium text-[#F5F5F5]">{rating.toFixed(1)}</span>
              </div>
              {reviewsCount > 0 && (
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className="flex items-center gap-1 text-sm text-[#A0A0A0] hover:text-gold-600 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  {reviewsCount} отзывов
                </button>
              )}
            </div>

            {/* Price */}
            {canBuy ? (
              <div className="flex items-baseline gap-4 flex-wrap">
                <span className="text-3xl lg:text-4xl font-bold text-gold-600">
                  {formatPrice(product.price)}
                </span>
                {product.old_price && (
                  <span className="text-xl text-[#666] line-through">
                    {formatPrice(product.old_price)}
                  </span>
                )}
                {discount > 0 && (
                  <Badge className="bg-green-900/30 text-green-400 hover:bg-green-900/30">
                    Экономия {formatPrice(product.old_price! - product.price)}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
                <p className="text-sm text-gold-700 font-medium">
                  {!user ? 'Войдите в аккаунт, чтобы видеть цены и совершать покупки' : 'Покупка доступна только для лиц старше 21 года'}
                </p>
                {!user && (
                  <Link href={`/login?redirect=/product/${slug}`}>
                    <Button size="sm" className="mt-2 bg-gold-500 hover:bg-gold-600 text-white">
                      Войти
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.in_stock ? (
                <Badge className="bg-green-900/30 text-green-400 hover:bg-green-900/30 gap-1">
                  <Check className="w-4 h-4" />
                  В наличии
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Нет в наличии
                </Badge>
              )}
              {product.in_stock && product.stock !== undefined && product.stock <= 5 && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Осталось мало ({product.stock} шт.)
                </Badge>
              )}
            </div>

            <Separator className="bg-[#2A2A2A]" />

            {/* Quantity & Add to Cart */}
            {canBuy && (
            <div className="space-y-4">
              {(() => {
                const existingItem = product ? getItemInCart(product.id) : undefined;
                const inCartQty = existingItem?.quantity || 0;

                return (
                  <>
                    {/* Already in cart indicator */}
                    {inCartQty > 0 && (
                      <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-xl px-4 py-2.5">
                        <Check className="w-4 h-4 text-gold-500" />
                        <span className="text-sm text-gold-500 font-medium">
                          В корзине: {inCartQty} шт.
                        </span>
                        <button
                          onClick={() => existingItem && removeItem(existingItem.id)}
                          className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Убрать
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-[#2A2A2A] rounded-xl bg-[#1E1E1E]">
                        <button
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="p-3 hover:bg-[#121212] transition-colors rounded-l-xl"
                          disabled={quantity <= 1}
                        >
                          <Minus className="w-4 h-4 text-[#A0A0A0]" />
                        </button>
                        <span className="w-14 text-center font-semibold text-[#F5F5F5]">{quantity}</span>
                        <button
                          onClick={() => setQuantity(q => q + 1)}
                          className="p-3 hover:bg-[#121212] transition-colors rounded-r-xl"
                          disabled={product.stock !== undefined && quantity >= product.stock}
                        >
                          <Plus className="w-4 h-4 text-[#A0A0A0]" />
                        </button>
                      </div>

                      {/* Total Price */}
                      <div className="text-right">
                        <p className="text-sm text-[#A0A0A0]">Итого:</p>
                        <p className="text-xl font-bold text-[#F5F5F5]">
                          {formatPrice(product.price * quantity)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleAddToCart}
                        disabled={isCartLoading || !product.in_stock}
                        className="flex-1 h-12 bg-gold-500 hover:bg-gold-600 text-white font-semibold text-base"
                      >
                        {isCartLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 mr-2" />
                        )}
                        {inCartQty > 0 ? `Добавить ещё ${quantity} шт.` : 'В корзину'}
                      </Button>
                      <Button
                        onClick={handleQuickBuy}
                        disabled={!product.in_stock}
                        variant="outline"
                        className="flex-1 h-12 border-gold-500/40 text-gold-600 hover:bg-gold-500/10 font-semibold text-base"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Купить сейчас
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
            )}

            <Separator className="bg-[#2A2A2A]" />

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 sm:p-4 bg-[#1E1E1E] rounded-xl border border-[#2A2A2A]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-500/15 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-gold-600" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#F5F5F5]">Доставка</p>
                <p className="text-[10px] sm:text-xs text-[#A0A0A0]">по всему КЗ</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-[#1E1E1E] rounded-xl border border-[#2A2A2A]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#F5F5F5]">Гарантия</p>
                <p className="text-[10px] sm:text-xs text-[#A0A0A0]">качества</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-[#1E1E1E] rounded-xl border border-[#2A2A2A]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#F5F5F5]">Оригинал</p>
                <p className="text-[10px] sm:text-xs text-[#A0A0A0]">100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8 lg:mt-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-1 h-auto flex-wrap gap-1">
              <TabsTrigger 
                value="description" 
                className="data-[state=active]:bg-gold-500 data-[state=active]:text-white rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 text-sm"
              >
                Описание
              </TabsTrigger>
              <TabsTrigger 
                value="specs" 
                className="data-[state=active]:bg-gold-500 data-[state=active]:text-white rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 text-sm"
              >
                Характеристики
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="data-[state=active]:bg-gold-500 data-[state=active]:text-white rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 text-sm"
              >
                Отзывы ({reviewsCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  {product.description ? (
                    <p className="text-[#A0A0A0] leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-[#A0A0A0] text-center py-8">
                      Описание товара отсутствует
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-6">
              <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  {product.attributes && product.attributes.length > 0 ? (
                    <dl className="divide-y divide-[#2A2A2A]">
                      {product.attributes.map((attr: ProductAttribute) => (
                        <div key={attr.id} className="flex justify-between py-3 sm:py-4 first:pt-0 last:pb-0">
                          <dt className="text-[#A0A0A0] text-sm sm:text-base">{attr.name}</dt>
                          <dd className="text-[#F5F5F5] font-medium text-sm sm:text-base">{attr.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-[#A0A0A0] text-center py-8">
                      Характеристики не указаны
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" id="reviews" className="mt-6 space-y-6">
              {/* Reviews Summary */}
              <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b border-[#2A2A2A]">
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl font-bold text-[#F5F5F5]">
                        {rating > 0 ? rating.toFixed(1) : '—'}
                      </div>
                      <div className="flex items-center justify-center mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4 sm:h-5 sm:w-5",
                              star <= Math.round(rating) 
                                ? "text-amber-400 fill-amber-400" 
                                : "text-gray-200"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-[#A0A0A0] mt-1">{reviewsCount} отзывов</p>
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = stats?.rating_distribution?.[stars as keyof typeof stats.rating_distribution] || 0;
                        const percentage = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-[#A0A0A0] w-3">{stars}</span>
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <div className="flex-1 h-2 bg-[#252525] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#666] w-6">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Write Review Button or Edit Button */}
                  <div className="text-center">
                    {user ? (
                      userReview && !editingReview ? (
                        <div className="space-y-3">
                          <p className="text-sm text-[#A0A0A0]">Вы уже оставили отзыв</p>
                          <div className="flex justify-center gap-3">
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setEditingReview(true);
                                setShowReviewForm(true);
                              }}
                              className="border-gold-500/40 text-gold-600 hover:bg-gold-500/10"
                            >
                              Редактировать
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={handleDeleteReview}
                              className="border-red-300 text-red-400 hover:bg-red-900/20"
                            >
                              Удалить
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setShowReviewForm(!showReviewForm)}
                          className="bg-gold-500 hover:bg-gold-600 text-white"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {showReviewForm ? 'Отменить' : 'Написать отзыв'}
                        </Button>
                      )
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-[#A0A0A0]">Войдите, чтобы оставить отзыв</p>
                        <Link href={`/login?redirect=/product/${slug}`}>
                          <Button className="bg-gold-500 hover:bg-gold-600 text-white">
                            Войти
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Review Form */}
              {showReviewForm && user && (
                <ReviewForm
                  productId={product.id}
                  initialData={editingReview && userReview ? {
                    rating: userReview.rating,
                    title: userReview.title || '',
                    comment: userReview.comment || '',
                    pros: userReview.pros || '',
                    cons: userReview.cons || '',
                  } : undefined}
                  onSubmit={handleSubmitReview}
                  onCancel={() => {
                    setShowReviewForm(false);
                    setEditingReview(false);
                  }}
                  isLoading={isReviewsLoading}
                />
              )}

              {/* Reviews List */}
              {isReviewsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isOwn={review.user_id === user?.id}
                      onEdit={() => {
                        setEditingReview(true);
                        setShowReviewForm(true);
                      }}
                      onDelete={handleDeleteReview}
                      onHelpful={() => markAsHelpful(review.id)}
                    />
                  ))}
                </div>
              ) : !showReviewForm && (
                <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-sm">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-[#A0A0A0]">
                      Пока нет отзывов. Будьте первым!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
}
