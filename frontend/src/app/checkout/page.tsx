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
  Loader2,
  AlertTriangle,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  Package
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/utils';

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

const deliveryMethods: { id: DeliveryMethod; name: string; price: number; description: string }[] = [
  { id: 'courier', name: 'Курьер', price: 1500, description: 'Доставка в течение 1-2 дней' },
  { id: 'pickup', name: 'Самовывоз', price: 0, description: 'Из пункта выдачи' },
  { id: 'post', name: 'Почта', price: 800, description: 'Доставка 3-7 дней' },
];

const paymentMethods: { id: PaymentMethod; name: string; description: string }[] = [
  { id: 'kaspi', name: 'Kaspi перевод', description: 'Оплата через Kaspi приложение' },
  { id: 'card', name: 'Банковская карта', description: 'Visa, Mastercard' },
  { id: 'cash', name: 'Наличными', description: 'При получении' },
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
    },
  });

  const deliveryPrice = deliveryMethods.find(d => d.id === deliveryMethod)?.price || 0;
  const finalTotal = totalAmount + deliveryPrice;

  const handleAddressSubmit = (data: AddressForm) => {
    setAddressData(data);
    setStep(2);
  };

  const handleDeliverySubmit = () => {
    setStep(3);
  };

  const handlePaymentSubmit = () => {
    setStep(4);
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
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ ограничен</h1>
          <Link href="/login" className="text-gold-600 hover:underline">
            Войти в систему
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Корзина пуста</h1>
          <Link
            href="/catalog"
            className="inline-block bg-gold-500 hover:bg-gold-600 text-white py-3 px-6 rounded-lg"
          >
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <Link
              href="/cart"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              Вернуться в корзину
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Оформление заказа</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: 'Адрес', icon: MapPin },
            { num: 2, label: 'Доставка', icon: Truck },
            { num: 3, label: 'Оплата', icon: CreditCard },
            { num: 4, label: 'Подтверждение', icon: CheckCircle },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  step >= s.num
                    ? 'bg-gold-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
              </div>
              {idx < 3 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    step > s.num ? 'bg-gold-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Адрес доставки
                </h2>
                <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Город *
                      </label>
                      <input
                        {...register('city')}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                        placeholder="Алматы"
                      />
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Телефон *
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                        placeholder="+7 777 123 45 67"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адрес *
                    </label>
                    <input
                      {...register('address')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                      placeholder="ул. Абая, д. 10"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Квартира/Офис
                      </label>
                      <input
                        {...register('apartment')}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                        placeholder="кв. 15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Индекс
                      </label>
                      <input
                        {...register('postalCode')}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                        placeholder="050000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Комментарий к заказу
                    </label>
                    <textarea
                      {...register('comment')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                      placeholder="Дополнительная информация для курьера..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-lg font-medium"
                  >
                    Продолжить
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Delivery */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Способ доставки
                </h2>
                <div className="space-y-3 mb-6">
                  {deliveryMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        deliveryMethod === method.id
                          ? 'border-gold-500 bg-gold-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          checked={deliveryMethod === method.id}
                          onChange={() => setDeliveryMethod(method.id)}
                          className="w-4 h-4 text-gold-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                      <span className="font-medium text-gray-900">
                        {method.price === 0 ? 'Бесплатно' : formatPrice(method.price)}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg"
                  >
                    Назад
                  </button>
                  <button
                    onClick={handleDeliverySubmit}
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-lg font-medium"
                  >
                    Продолжить
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Способ оплаты
                </h2>
                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.id
                          ? 'border-gold-500 bg-gold-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="w-4 h-4 text-gold-500 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg"
                  >
                    Назад
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-lg font-medium"
                  >
                    Продолжить
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Подтверждение заказа
                </h2>

                {/* Address Summary */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">Адрес доставки</p>
                      <p className="text-gray-600 text-sm">
                        {addressData?.city}, {addressData?.address}
                        {addressData?.apartment && `, ${addressData.apartment}`}
                      </p>
                      <p className="text-gray-600 text-sm">Тел: {addressData?.phone}</p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-gold-600 hover:underline text-sm"
                    >
                      Изменить
                    </button>
                  </div>
                </div>

                {/* Delivery Summary */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">Доставка</p>
                      <p className="text-gray-600 text-sm">
                        {deliveryMethods.find(d => d.id === deliveryMethod)?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      className="text-gold-600 hover:underline text-sm"
                    >
                      Изменить
                    </button>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">Оплата</p>
                      <p className="text-gray-600 text-sm">
                        {paymentMethods.find(p => p.id === paymentMethod)?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(3)}
                      className="text-gold-600 hover:underline text-sm"
                    >
                      Изменить
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <p className="font-medium text-gray-900 mb-3">Товары</p>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3 py-2">
                        <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden">
                          {item.product?.image_url && (
                            <Image
                              src={item.product.image_url}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{item.product?.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} шт.</p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatPrice((item.product?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg"
                  >
                    Назад
                  </button>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isOrderLoading}
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isOrderLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isOrderLoading ? 'Создание заказа...' : 'Подтвердить заказ'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ваш заказ</h2>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
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
                      <p className="text-sm text-gray-900 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} шт.</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Товары ({totalItems})</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Доставка</span>
                  <span>{deliveryPrice === 0 ? 'Бесплатно' : formatPrice(deliveryPrice)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Итого</span>
                  <span className="text-gold-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Warning */}
      <footer className="bg-slate-900 text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          Минздрав предупреждает: курение вредит Вашему здоровью
        </div>
      </footer>
    </div>
  );
}
