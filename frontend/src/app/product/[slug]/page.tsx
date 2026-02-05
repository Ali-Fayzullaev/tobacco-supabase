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
  Package
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPrice } from '@/lib/utils';
import type { ProductFull, ProductImage, ProductAttribute } from '@/lib/types';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { getFullProduct, isLoading: isProductLoading } = useProducts();
  const { addToCart, isLoading: isCartLoading } = useCart();
  const { toggleFavorite, isFavorite, isLoading: isFavLoading } = useFavorites();

  const [product, setProduct] = useState<ProductFull | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isAdult = profile?.birth_date && 
    new Date(profile.birth_date) <= new Date(new Date().setFullYear(new Date().getFullYear() - 18));

  useEffect(() => {
    if (!isAuthLoading && user && isAdult && slug) {
      loadProduct();
    }
  }, [slug, isAuthLoading, user, isAdult]);

  const loadProduct = async () => {
    const result = await getFullProduct(slug);
    if (result.success && result.data) {
      setProduct(result.data as unknown as ProductFull);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.id, quantity);
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

  // Loading state
  if (isAuthLoading || isProductLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ ограничен</h1>
          <p className="text-gray-500 mb-6">
            Для просмотра товаров необходимо войти в систему.
          </p>
          <Link
            href={`/login?redirect=/product/${slug}`}
            className="inline-block bg-gold-500 hover:bg-gold-600 text-white py-3 px-6 rounded-lg font-medium"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещён</h1>
          <p className="text-gray-500 mb-6">
            Продажа табачной продукции лицам младше 18 лет запрещена.
          </p>
          <Link href="/" className="inline-block bg-gray-100 text-gray-700 py-3 px-6 rounded-lg">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Товар не найден</h1>
          <Link href="/catalog" className="text-gold-600 hover:underline">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  const isFav = isFavorite(product.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-gold-500">
              Tobacco Shop KZ
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/catalog" className="text-gray-600 hover:text-gray-900">
                Каталог
              </Link>
              <Link href="/cart" className="text-gray-600 hover:text-gray-900">
                Корзина
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                Профиль
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/catalog" className="text-gray-500 hover:text-gray-700">
                Каталог
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate">{product.name}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              {images[selectedImageIndex]?.image_url ? (
                <Image
                  src={images[selectedImageIndex].image_url}
                  alt={images[selectedImageIndex].alt_text || product.name}
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Нет изображения
                </div>
              )}
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(i => i > 0 ? i - 1 : images.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === selectedImageIndex 
                        ? 'border-gold-500' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {img.image_url ? (
                      <Image
                        src={img.image_url}
                        alt={img.alt_text || ''}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            {product.brand && (
              <p className="text-gold-600 font-medium">{product.brand}</p>
            )}

            {/* Name */}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-bold text-gold-600">
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.in_stock ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-green-600">В наличии</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600">Нет в наличии</span>
                </>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-3 hover:bg-gray-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="p-3 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isCartLoading || !product.in_stock}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isCartLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
                В корзину
              </button>

              <button
                onClick={handleToggleFavorite}
                disabled={isFavLoading}
                className={`p-3 rounded-lg border transition-colors ${
                  isFav 
                    ? 'border-red-200 bg-red-50 text-red-500' 
                    : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-200">
              <div className="text-center">
                <Truck className="w-6 h-6 text-gold-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Доставка по КЗ</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 text-gold-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Гарантия качества</p>
              </div>
              <div className="text-center">
                <Package className="w-6 h-6 text-gold-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Оригинал 100%</p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-2">Описание</h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">Характеристики</h2>
                <dl className="space-y-2">
                  {product.attributes.map((attr: ProductAttribute) => (
                    <div key={attr.id} className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">{attr.name}</dt>
                      <dd className="text-gray-900 font-medium">{attr.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Warning */}
      <footer className="bg-slate-900 text-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          Минздрав предупреждает: курение вредит Вашему здоровью
        </div>
      </footer>
    </div>
  );
}
