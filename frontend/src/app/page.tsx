'use client';

import Link from 'next/link';
import { 
  ShieldCheck, 
  Truck, 
  Package, 
  Clock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Star,
  ChevronRight,
  CreditCard,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export default function HomePage() {
  const { settings } = useStoreSettings();
  
  const storeName = settings.store_name || 'Tobacco Shop';
  const storePhone = settings.store_phone || '+7 (777) 123-45-67';
  const freeDeliveryAmount = settings.free_delivery_threshold || '15000';
  const deliveryDays = settings.delivery_days || '1-3';
  const features = [
    {
      icon: ShieldCheck,
      title: 'Оригинальная продукция',
      description: 'Только сертифицированные товары от официальных дистрибьюторов',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Truck,
      title: 'Быстрая доставка',
      description: 'Доставка по Алматы за 2 часа, по Казахстану — 1-3 дня',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Package,
      title: 'Широкий ассортимент',
      description: 'Более 500 наименований сигарет, вейпов и аксессуаров',
      color: 'from-purple-500 to-violet-600',
    },
    {
      icon: Clock,
      title: 'Работаем 24/7',
      description: 'Принимаем заказы круглосуточно, онлайн поддержка',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const brands = [
    'Marlboro', 'Parliament', 'Winston', 'Camel', 'Kent', 'Lucky Strike', 'Davidoff', 'Dunhill'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
                <span className="text-lg font-bold text-white">{storeName.charAt(0)}</span>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{storeName.split(' ')[0] || 'Tobacco'}</span>
                <span className="text-lg font-bold text-orange-500">{storeName.split(' ').slice(1).join(' ') || 'Shop'}</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-orange-600">
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
                  Регистрация
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-orange-50/30 to-white">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-300/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-1.5 bg-orange-100 text-orange-600 border-orange-200">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Премиум качество
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-gray-900">Премиальные </span>
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                табачные изделия
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Широкий ассортимент качественной продукции от ведущих мировых брендов.
              Быстрая доставка по всему Казахстану.
            </p>

            {/* Age Warning */}
            <Card className="bg-red-50 border-red-200 mb-10 max-w-xl mx-auto shadow-lg">
              <CardContent className="py-5 px-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <span className="text-3xl font-bold text-red-500">18+</span>
                </div>
                <p className="text-red-600 text-sm">
                  Данный сайт предназначен только для лиц, достигших 18-летнего возраста.
                  Продажа табачных изделий несовершеннолетним запрещена законодательством РК.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 gap-2 w-full sm:w-auto text-lg px-8 py-6 shadow-xl shadow-orange-500/25">
                  Зарегистрироваться
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 border-gray-300 text-gray-700 hover:bg-gray-50">
                  У меня есть аккаунт
                </Button>
              </Link>
            </div>
            
            <p className="text-gray-500 mt-6 text-sm">
              Для просмотра каталога необходима регистрация и подтверждение возраста
            </p>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="border-y border-gray-100 bg-gray-50 py-8 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex gap-12 items-center justify-center flex-wrap">
            {brands.map((brand, i) => (
              <span key={i} className="text-gray-400 text-xl font-semibold whitespace-nowrap hover:text-gray-600 transition-colors cursor-default">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Почему выбирают нас</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Мы заботимся о качестве продукции и удобстве наших клиентов
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-white border-gray-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 group"
            >
              <CardContent className="p-6 text-center">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* About & Payment */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* About */}
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">О нашем магазине</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Tobacco Shop KZ — ведущий интернет-магазин табачных изделий в Казахстане. 
                    Мы работаем с 2024 года и за это время заслужили доверие тысяч клиентов.
                  </p>
                  <p>
                    Наш ассортимент включает сигареты, сигары, табак для кальяна, 
                    электронные сигареты и вейпы, а также аксессуары от лучших мировых производителей.
                  </p>
                  <p>
                    Мы гарантируем подлинность всей продукции и соблюдение условий хранения.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center">
                        <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">4.9 из 5</p>
                    <p className="text-gray-500 text-sm">Более 5000 отзывов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Delivery */}
            <div className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Способы оплаты</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Kaspi перевод',
                      'Банковские карты (Visa, MasterCard)',
                      'Наличными при получении',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-600">
                        <ChevronRight className="h-4 w-4 text-orange-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Доставка</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Курьером по городу — от 2 часов',
                      'Самовывоз из магазина',
                      'Доставка по Казахстану — 1-3 дня',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-600">
                        <ChevronRight className="h-4 w-4 text-orange-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-2xl shadow-orange-500/30 overflow-hidden">
          <CardContent className="p-8 md:p-12 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Готовы сделать заказ?
              </h2>
              <p className="text-orange-100 text-lg mb-8">
                Зарегистрируйтесь сейчас и получите скидку 10% на первый заказ!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 gap-2 px-8">
                    Создать аккаунт
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href={`tel:${storePhone.replace(/[^+\d]/g, '')}`}>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2 px-8">
                    <Phone className="h-5 w-5" />
                    {storePhone}
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Health Warning */}
      <section className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-6 px-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-red-700 font-bold text-lg mb-2">
                  ПРЕДУПРЕЖДЕНИЕ МИНИСТЕРСТВА ЗДРАВООХРАНЕНИЯ РК
                </h3>
                <p className="text-red-600">
                  Курение вызывает рак лёгких и другие заболевания. 
                  Никотин вызывает привыкание. Продажа табачных изделий лицам младше 18 лет запрещена.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <span className="text-sm font-bold text-white">{storeName.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-gray-500">
                  © {new Date().getFullYear()} {storeName}
                </span>
              </Link>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-orange-500 transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-orange-500 transition-colors">
                Условия использования
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-lg">🇰🇿</span>
                <span className="text-red-500 font-bold">18+</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
