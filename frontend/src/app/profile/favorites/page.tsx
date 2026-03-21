'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { ProductCardSkeleton } from '@/components/Skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

export default function FavoritesPage() {
  const { favorites, toggleFavorite, loadFavorites, isLoading } = useFavorites();
  const { addToCart, isLoading: isCartLoading } = useCart();

  useEffect(() => {
    loadFavorites();
  }, []);

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Избранное</h1>
        
        <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#2A2A2A] p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-[#F5F5F5] mb-2">
            Список избранного пуст
          </h2>
          <p className="text-[#A0A0A0] mb-6">
            Добавляйте понравившиеся товары, нажимая на сердечко
          </p>
          <Link
            href="/catalog"
            className="inline-block bg-gold-500 hover:bg-gold-600 text-white py-3 px-6 rounded-lg font-medium"
          >
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Избранное</h1>
        <span className="text-[#A0A0A0]">{favorites.length} товаров</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((item) => {
          const product = item.product;
          if (!product) return null;

          return (
            <div
              key={item.id}
              className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#2A2A2A] overflow-hidden group"
            >
              <Link href={`/product/${product.slug}`}>
                <div className="relative aspect-square bg-[#252525]">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#666]">
                      Нет фото
                    </div>
                  )}
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium">Нет в наличии</span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <Link href={`/product/${product.slug}`} className="hover:text-gold-600">
                  <h3 className="font-medium text-[#F5F5F5] line-clamp-2">{product.name}</h3>
                </Link>
                {product.brand && (
                  <p className="text-sm text-[#A0A0A0] mt-1">{product.brand}</p>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-gold-600">
                    {formatPrice(product.price)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="p-2 text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Удалить из избранного"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => addToCart(product.id, 1)}
                      disabled={isCartLoading || !product.in_stock}
                      className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Добавить в корзину"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
