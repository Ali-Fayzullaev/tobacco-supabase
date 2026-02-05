'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  Package,
  Shield,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { formatPrice, cn } from '@/lib/utils';

const addressSchema = z.object({
  city: z.string().min(2, 'Укажите город'),
  address: z.string().min(5, 'Укажите адрес доставки'),
  apartment: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().min(10, 'Укажите телефон для связи'),
  comment: z.string().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

type DeliveryMethod = 'courier' | 'pickup' | 'post';
type PaymentMethod = 'kaspi' | 'card' | 'cash';

const deliveryMethods: { id: DeliveryMethod; name: string; price: number; description: string; icon: string; time: string }[] = [
  { id: 'courier', name: 'Курьерская доставка', price: 1500, description: 'До двери', icon: '🚚', time: '1-2 дня' },
  { id: 'pickup', name: 'Самовывоз', price: 0, description: 'Из пункта выдачи', icon: '📍', time: 'Сегодня' },
  { id: 'post', name: 'Казпочта', price: 800, description: 'По всему Казахстану', icon: '📦', time: '3-7 дней' },
];

const paymentMethods: { id: PaymentMethod; name: string; description: string; icon: string }[] = [
  { id: 'kaspi', name: 'Kaspi перевод', description: 'Мгновенная оплата', icon: '🏦' },
  { id: 'card', name: 'Банковская карта', description: 'Visa, Mastercard', icon: '💳' },
  { id: 'cash', name: 'Наличными', description: 'При получении', icon: '💵' },
];

const steps = [
  { num: 1, label: 'Адрес', icon: MapPin },
  { num: 2, label: 'Доставка', icon: Truck },
  { num: 3, label: 'Оплата', icon: CreditCard },
  { num: 4, label: 'Подтверждение', icon: CheckCircle },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { cartItems, totalAmount, totalItems, clearCart } = useCart();
  const { createOrder, isLoading: isOrderLoading } = useOrders();

  const [step, setStep] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('kaspi');
  const [addressData, setAddressData] = useState<AddressForm | null>(null);

  const isAdult = profile?.birth_date && 
    new Date(profile.birth_date) <= new Date(new Date().setFullYear(new Date().getFullYear() - 18));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      phone: profile?.phone || '',
      city: profile?.city || '',
      address: profile?.address || '',
    },
  });

  const deliveryPrice = deliveryMethods.find(d => d.id === deliveryMethod)?.price || 0;
  const finalTotal = totalAmount + deliveryPrice;

  const handleAddressSubmit = (data: AddressForm) => {
    setAddressData(data);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeliverySubmit = () => {
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSubmit = () => {
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmOrder = async () => {
    if (!addressData) return;

    const result = await createOrder({
      deliveryMethod: deliveryMethod as any,
      paymentMethod,
      shippingAddress: {
        city: addressData.city,
        address: addressData.address,
        apartment: addressData.apartment,
        postalCode: addressData.postalCode,
      },
      phone: addressData.phone,
      comment: addressData.comment,
    });

    if (result.success && result.order_number) {
      await clearCart();
      router.push(`/order-success?number=${result.order_number}`);
    } else {
      toast.error(result.error || 'Ошибка при создании заказа');
    }
  };

  // Auth checks
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Доступ ограничен</h1>
            <p className="text-gray-600 mb-6">
              Для оформления заказа необходимо войти в аккаунт и подтвердить возраст (18+)
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-8 rounded-xl font-medium transition-colors"
            >
              Войти в систему
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Корзина пуста</h1>
            <p className="text-gray-600 mb-6">
              Добавьте товары в корзину, чтобы оформить заказ
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-8 rounded-xl font-medium transition-colors"
            >
              Перейти в каталог
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Вернуться в корзину
          </Link>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Оформление заказа</h1>
            <p className="text-gray-600 mt-1">Заполните данные для доставки</p>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <button
                    onClick={() => step > s.num && setStep(s.num)}
                    disabled={step < s.num}
                    className={cn(
                      "flex items-center gap-3 transition-all",
                      step >= s.num ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        step > s.num 
                          ? "bg-green-500 text-white" 
                          : step === s.num 
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" 
                            : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {step > s.num ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <s.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className={cn(
                        "text-xs uppercase tracking-wide",
                        step >= s.num ? "text-orange-600" : "text-gray-400"
                      )}>
                        Шаг {s.num}
                      </p>
                      <p className={cn(
                        "font-medium",
                        step >= s.num ? "text-gray-900" : "text-gray-400"
                      )}>
                        {s.label}
                      </p>
                    </div>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className={cn(
                        "h-1 rounded-full transition-all",
                        step > s.num ? "bg-green-500" : "bg-gray-200"
                      )} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Address */}
              {step === 1 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Адрес доставки
                    </h2>
                  </div>
                  <form onSubmit={handleSubmit(handleAddressSubmit)} className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Город <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('city')}
                          type="text"
                          className={cn(
                            "w-full px-4 py-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none",
                            errors.city ? "border-red-300" : "border-gray-200"
                          )}
                          placeholder="Алматы"
                        />
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Телефон <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('phone')}
                          type="tel"
                          className={cn(
                            "w-full px-4 py-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none",
                            errors.phone ? "border-red-300" : "border-gray-200"
                          )}
                          placeholder="+7 777 123 45 67"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Адрес <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('address')}
                        type="text"
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none",
                          errors.address ? "border-red-300" : "border-gray-200"
                        )}
                        placeholder="ул. Абая, д. 10"
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Квартира/Офис
                        </label>
                        <input
                          {...register('apartment')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                          placeholder="кв. 15"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Индекс
                        </label>
                        <input
                          {...register('postalCode')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                          placeholder="050000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Комментарий к заказу
                      </label>
                      <textarea
                        {...register('comment')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none outline-none"
                        placeholder="Дополнительная информация для курьера..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 flex items-center justify-center gap-2"
                    >
                      Продолжить
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Delivery */}
              {step === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Способ доставки
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      {deliveryMethods.map((method) => (
                        <label
                          key={method.id}
                          className={cn(
                            "flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all",
                            deliveryMethod === method.id
                              ? "border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10"
                              : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                              deliveryMethod === method.id ? "bg-orange-100" : "bg-gray-100"
                            )}>
                              {method.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{method.name}</p>
                              <p className="text-sm text-gray-500">{method.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-500">{method.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "font-bold text-lg",
                              method.price === 0 ? "text-green-600" : "text-gray-900"
                            )}>
                              {method.price === 0 ? 'Бесплатно' : formatPrice(method.price)}
                            </span>
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              deliveryMethod === method.id 
                                ? "border-orange-500 bg-orange-500" 
                                : "border-gray-300"
                            )}>
                              {deliveryMethod === method.id && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="delivery"
                            className="hidden"
                            checked={deliveryMethod === method.id}
                            onChange={() => setDeliveryMethod(method.id)}
                          />
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Назад
                      </button>
                      <button
                        onClick={handleDeliverySubmit}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                      >
                        Продолжить
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Способ оплаты
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={cn(
                            "flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all",
                            paymentMethod === method.id
                              ? "border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10"
                              : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                              paymentMethod === method.id ? "bg-orange-100" : "bg-gray-100"
                            )}>
                              {method.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{method.name}</p>
                              <p className="text-sm text-gray-500">{method.description}</p>
                            </div>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            paymentMethod === method.id 
                              ? "border-orange-500 bg-orange-500" 
                              : "border-gray-300"
                          )}>
                            {paymentMethod === method.id && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <input
                            type="radio"
                            name="payment"
                            className="hidden"
                            checked={paymentMethod === method.id}
                            onChange={() => setPaymentMethod(method.id)}
                          />
                        </label>
                      ))}
                    </div>

                    {/* Security Notice */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Безопасная оплата</p>
                        <p className="text-sm text-green-600">
                          Все платежи защищены шифрованием SSL
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Назад
                      </button>
                      <button
                        onClick={handlePaymentSubmit}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                      >
                        Продолжить
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && (
                <div className="space-y-6">
                  {/* Order Summary Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Подтверждение заказа
                      </h2>
                    </div>
                    <div className="p-6">
                      {/* Address Summary */}
                      <div className="flex justify-between items-start pb-5 border-b border-gray-100">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Адрес доставки</p>
                            <p className="text-gray-600">
                              {addressData?.city}, {addressData?.address}
                              {addressData?.apartment && `, ${addressData.apartment}`}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">Тел: {addressData?.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setStep(1)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          Изменить
                        </button>
                      </div>

                      {/* Delivery Summary */}
                      <div className="flex justify-between items-start py-5 border-b border-gray-100">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Способ доставки</p>
                            <p className="text-gray-600">
                              {deliveryMethods.find(d => d.id === deliveryMethod)?.name}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                              {deliveryMethods.find(d => d.id === deliveryMethod)?.time}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setStep(2)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          Изменить
                        </button>
                      </div>

                      {/* Payment Summary */}
                      <div className="flex justify-between items-start py-5 border-b border-gray-100">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Способ оплаты</p>
                            <p className="text-gray-600">
                              {paymentMethods.find(p => p.id === paymentMethod)?.name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setStep(3)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          Изменить
                        </button>
                      </div>

                      {/* Items */}
                      <div className="pt-5">
                        <p className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5 text-gray-400" />
                          Товары в заказе
                        </p>
                        <div className="space-y-3">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                              <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                {item.product?.image_url && (
                                  <Image
                                    src={item.product.image_url}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{item.product?.name}</p>
                                <p className="text-sm text-gray-500">{item.quantity} шт.</p>
                              </div>
                              <span className="font-semibold text-gray-900">
                                {formatPrice((item.product?.price || 0) * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Назад
                    </button>
                    <button
                      onClick={handleConfirmOrder}
                      disabled={isOrderLoading}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isOrderLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Создание заказа...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Подтвердить заказ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                <div className="bg-gray-900 px-6 py-4">
                  <h2 className="text-lg font-semibold text-white">Ваш заказ</h2>
                </div>
                
                <div className="p-6">
                  {/* Items List */}
                  <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                          {item.product?.image_url && (
                            <Image
                              src={item.product.image_url}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} шт.</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {formatPrice((item.product?.price || 0) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Товары ({totalItems})</span>
                      <span className="font-medium">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Доставка</span>
                      <span className={cn(
                        "font-medium",
                        deliveryPrice === 0 && "text-green-600"
                      )}>
                        {deliveryPrice === 0 ? 'Бесплатно' : formatPrice(deliveryPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200">
                      <span className="text-gray-900">Итого</span>
                      <span className="text-orange-600">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Promo Badge */}
                  <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-orange-800">
                      🎉 Бесплатная доставка от 15 000 ₸
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
