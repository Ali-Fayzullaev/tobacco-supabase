'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight,
  Loader2,
  AlertTriangle,
  Truck,
  Shield
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md bg-white border-gray-200 shadow-lg">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ ограничен</h1>
            <p className="text-gray-500 mb-6">
              Для доступа к корзине необходимо войти в систему.
            </p>
            <Link href="/login?redirect=/cart">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                Войти
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md bg-white border-gray-200 shadow-lg">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещён</h1>
            <p className="text-gray-500 mb-6">
              Продажа табачной продукции лицам младше 18 лет запрещена.
            </p>
            <Link href="/">
              <Button variant="outline" className="border-gray-300">
                На главную
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Корзина</h1>

          {cartItems.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="py-16 text-center">
                <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h2 className="text-2xl font-medium text-gray-900 mb-3">Корзина пуста</h2>
                <p className="text-gray-500 mb-8">
                  Добавьте товары из каталога для оформления заказа
                </p>
                <Link href="/catalog">
                  <Button size="lg" className="gap-2 bg-orange-500 hover:bg-orange-600">
                    Перейти в каталог
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Header */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4 flex justify-between items-center">
                    <span className="text-gray-600">
                      {totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'}
                    </span>
                    <button
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-600 text-sm transition-colors"
                    >
                      Очистить корзину
                    </button>
                  </CardContent>
                </Card>

                {/* Items */}
                {cartItems.map((item) => (
                  <Card key={item.id} className="bg-white border-gray-200 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex gap-4">
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
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingBag className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/product/${item.product?.slug}`}
                          className="font-medium text-gray-900 hover:text-orange-500 line-clamp-2 transition-colors"
                        >
                          {item.product?.name}
                        </Link>
                        {item.product?.brand && (
                          <p className="text-sm text-gray-500 mt-1">{item.product.brand}</p>
                        )}
                        <p className="text-xl font-bold text-orange-500 mt-2">
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

                        <div className="flex items-center bg-gray-100 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={isLoading || item.quantity <= 1}
                            className="p-2 text-gray-600 hover:text-orange-500 disabled:opacity-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-medium text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isLoading}
                            className="p-2 text-gray-600 hover:text-orange-500 disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="bg-white border-gray-200 shadow-sm sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Итого</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-600">
                        <span>Товары ({totalItems})</span>
                        <span>{formatPrice(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Доставка</span>
                        <span className="text-green-500 font-medium">Бесплатно</span>
                      </div>
                    </div>

                    <Separator className="bg-gray-200 mb-6" />

                    <div className="flex justify-between text-xl font-bold mb-6">
                      <span className="text-gray-900">К оплате</span>
                      <span className="text-orange-500">{formatPrice(totalAmount)}</span>
                    </div>

                    <Link href="/checkout" className="block">
                      <Button size="lg" className="w-full gap-2 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
                        Оформить заказ
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>

                    <Link
                      href="/catalog"
                      className="block text-center text-orange-500 hover:text-orange-600 mt-4 transition-colors"
                    >
                      Продолжить покупки
                    </Link>

                    {/* Benefits */}
                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Truck className="h-5 w-5 text-green-500" />
                        <span>Бесплатная доставка от 15 000 ₸</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <span>Гарантия качества товара</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
