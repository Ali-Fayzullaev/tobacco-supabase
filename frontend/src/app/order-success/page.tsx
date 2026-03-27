'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  CheckCircle, 
  Package, 
  ArrowRight, 
  Loader2, 
  Truck, 
  Phone,
  Mail,
  Copy,
  Check,
  ShoppingBag,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';
import { useStoreSettings } from '@/hooks/useStoreSettings';

// Динамический импорт конфетти без SSR
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

function OrderSuccessContent() {
  const { settings } = useStoreSettings();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('number');
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Устанавливаем размеры окна на клиенте
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    // Скрываем конфетти через 5 секунд
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    { icon: CheckCircle, label: 'Заказ принят', active: true, completed: true },
    { icon: Package, label: 'Подготовка', active: false, completed: false },
    { icon: Truck, label: 'В пути', active: false, completed: false },
    { icon: MapPin, label: 'Доставлен', active: false, completed: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] via-[#141414] to-[#121212]">
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#f97316', '#22c55e', '#fbbf24', '#3b82f6', '#ec4899']}
        />
      )}
      
      <Header />
      
      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Success Card */}
            <div className="bg-[#1E1E1E] rounded-3xl shadow-xl overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-center text-white relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-[#1E1E1E]/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#1E1E1E]/10 rounded-full translate-x-1/2 translate-y-1/2" />
                
                <div className="relative">
                  <div className="w-24 h-24 bg-[#1E1E1E] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle className="w-14 h-14 text-green-500" />
                  </div>

                  <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    Заказ успешно оформлен!
                    <Sparkles className="w-6 h-6" />
                  </h1>
                  <p className="text-green-100">
                    Спасибо за покупку в нашем магазине
                  </p>
                </div>
              </div>

              <div className="p-8">
                {/* Order Number */}
                {orderNumber && (
                  <div className="bg-[#121212] rounded-2xl p-6 mb-8">
                    <p className="text-sm text-[#A0A0A0] mb-2 text-center">Номер вашего заказа</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-bold text-[#F5F5F5] tracking-wide">
                        #{orderNumber}
                      </span>
                      <button
                        onClick={copyOrderNumber}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          copied 
                            ? "bg-green-900/30 text-green-400" 
                            : "bg-[#2A2A2A] text-[#A0A0A0] hover:bg-[#444]"
                        )}
                        title="Скопировать"
                      >
                        {copied ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Timeline */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-[#A0A0A0] mb-4 text-center">Статус заказа</h3>
                  <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-1">
                        <div className="relative">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                            step.completed 
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/30" 
                              : step.active 
                                ? "bg-gold-500 text-white shadow-lg shadow-gold-500/30 animate-pulse"
                                : "bg-[#252525] text-[#666]"
                          )}>
                            <step.icon className="w-5 h-5" />
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={cn(
                              "absolute top-1/2 left-full w-full h-1 -translate-y-1/2",
                              step.completed ? "bg-green-500" : "bg-[#2A2A2A]"
                            )} style={{ width: 'calc(100% + 0.5rem)' }} />
                          )}
                        </div>
                        <span className={cn(
                          "text-xs mt-2 text-center",
                          step.completed || step.active ? "text-[#F5F5F5] font-medium" : "text-[#666]"
                        )}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-gold-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#F5F5F5]">Ожидайте звонка</p>
                      <p className="text-sm text-[#A0A0A0]">
                        Менеджер свяжется для подтверждения
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[#F5F5F5]">Чек на почте</p>
                      <p className="text-sm text-[#A0A0A0]">
                        Детали заказа отправлены на email
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-800/30 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[#F5F5F5]">Срок доставки</p>
                      <p className="text-sm text-[#A0A0A0]">
                        1-3 рабочих дня
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[#F5F5F5]">Отслеживание</p>
                      <p className="text-sm text-[#A0A0A0]">
                        Статус в личном кабинете
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/profile/orders"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-gold-500/30 hover:shadow-xl"
                  >
                    <Package className="w-5 h-5" />
                    Мои заказы
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/catalog"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#252525] hover:bg-[#2A2A2A] text-[#C0C0C0] rounded-xl font-medium transition-all"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Продолжить покупки
                  </Link>
                </div>
              </div>
            </div>

            {/* Support Info */}
            <div className="mt-8 text-center">
              <p className="text-[#A0A0A0] text-sm mb-2">Возникли вопросы?</p>
              <a
                href={`tel:${settings.store_phone.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
              >
                <Phone className="w-4 h-4" />
                {settings.store_phone}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
          <p className="text-[#A0A0A0]">Загрузка...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
