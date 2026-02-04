'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { 
    cartItems, 
    totalAmount, 
    totalItems,
    updateQuantity, 
    removeItem, 
    clearCart,
    isLoading 
  } = useCart();

  const isAdult = profile?.birth_date && 
    new Date(profile.birth_date) <= new Date(new Date().setFullYear(new Date().getFullYear() - 18));

  // Auth check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ ограничен</h1>
          <p className="text-gray-500 mb-6">
            Для доступа к корзине необходимо войти в систему.
          </p>
          <Link
            href="/login?redirect=/cart"
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
              <Link href="/cart" className="text-gray-900 font-medium">
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Корзина</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Корзина пуста</h2>
            <p className="text-gray-500 mb-6">
              Добавьте товары из каталога для оформления заказа
            </p>
            <Link
              href="/catalog"
              className="inline-block bg-gold-500 hover:bg-gold-600 text-white py-3 px-6 rounded-lg font-medium"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
                <span className="text-gray-600">
                  {totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'}
                </span>
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Очистить корзину
                </button>
              </div>

              {/* Items */}
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4"
                >
                  {/* Image */}
                  <Link 
                    href={`/product/${item.product?.slug}`}
                    className="flex-shrink-0"
                  >
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product?.image_url ? (
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          Нет фото
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/product/${item.product?.slug}`}
                      className="font-medium text-gray-900 hover:text-gold-600 line-clamp-2"
                    >
                      {item.product?.name}
                    </Link>
                    {item.product?.brand && (
                      <p className="text-sm text-gray-500 mt-1">{item.product.brand}</p>
                    )}
                    <p className="text-lg font-bold text-gold-600 mt-2">
                      {formatPrice(item.product?.price || 0)}
                    </p>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={isLoading || item.quantity <= 1}
                        className="p-2 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Итого
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Товары ({totalItems})</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Доставка</span>
                    <span className="text-green-600">Бесплатно</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between text-lg font-bold">
                    <span>К оплате</span>
                    <span className="text-gold-600">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors"
                >
                  Оформить заказ
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/catalog"
                  className="w-full block text-center text-gold-600 hover:underline mt-4"
                >
                  Продолжить покупки
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Health Warning */}
      <footer className="bg-slate-900 text-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          Минздрав предупреждает: курение вредит Вашему здоровью
        </div>
      </footer>
    </div>
  );
}
