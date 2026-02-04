'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('number');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Заказ оформлен!
          </h1>

          {orderNumber && (
            <p className="text-gray-500 mb-6">
              Номер вашего заказа: <span className="font-medium text-gray-900">#{orderNumber}</span>
            </p>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <Package className="w-5 h-5" />
              <span>Мы свяжемся с вами для подтверждения</span>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-8">
            Информация о заказе отправлена на вашу почту. 
            Вы можете отслеживать статус в личном кабинете.
          </p>

          <div className="space-y-3">
            <Link
              href="/profile/orders"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors"
            >
              Мои заказы
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/catalog"
              className="w-full block text-center text-gold-600 hover:underline py-2"
            >
              Продолжить покупки
            </Link>
          </div>
        </div>

        {/* Health Warning */}
        <p className="text-gray-400 text-xs mt-6">
          Минздрав предупреждает: курение вредит Вашему здоровью
        </p>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
