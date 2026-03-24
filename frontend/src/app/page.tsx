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
import KazakhstanMap from '@/components/KazakhstanMap';

export default function HomePage() {
  const { settings } = useStoreSettings();
  
  const storeName = settings.store_name || 'Premium Tobacco';
  const storePhone = settings.store_phone || '+7 (700) 800-18-00';
  const freeDeliveryAmount = settings.free_delivery_threshold || '200000';
  const deliveryDays = settings.delivery_days || '1-7';
  const features = [
    {
      icon: ShieldCheck,
      title: 'Прямой импорт',
      description: 'Эксклюзивное представительство глобальных табачных производителей',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Truck,
      title: 'Доставка по всему КЗ',
      description: 'Прямая логистика из Астаны во все 17 областей. Отгрузка день в день',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Package,
      title: 'Склад в Астане',
      description: 'Собственный склад с полным ассортиментом в наличии',
      color: 'from-purple-500 to-violet-600',
    },
    {
      icon: Clock,
      title: 'Бесплатная доставка',
      description: `При заказе от ${Number(freeDeliveryAmount).toLocaleString('ru-RU')} ₸`,
      color: 'from-gold-500 to-red-900/200',
    },
  ];

  const brands = [
    'Табак для кальяна', 'Сигареты', 'Папиросы', 'Трубочный табак', 'Табак курительный', 'Сигариллы', 'Сигары', 'Аксессуары'
  ];

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#2A2A2A] bg-[#1E1E1E]/95 backdrop-blur-lg shadow-lg shadow-black/20">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-lg shadow-gold-500/25">
                <span className="text-lg font-bold text-[#121212]">{storeName.charAt(0)}</span>
              </div>
              <div>
                <span className="text-lg font-bold text-[#F5F5F5]">{storeName.split(' ')[0] || 'Shop'}</span>
                <span className="text-lg font-bold text-gold-500">{storeName.split(' ').slice(1).join(' ') || 'Shop'}</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10">
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold shadow-lg shadow-gold-500/25">
                  Регистрация
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#121212]">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-10 sm:py-16 md:py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-1.5 bg-gold-500/10 text-gold-500 border-gold-500/20">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Премиум качество
            </Badge>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-[#F5F5F5]">ТОО </span>
              <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                Premium Tobacco
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-[#A0A0A0] mb-8 sm:mb-10 max-w-2xl mx-auto">
              Ведущий импортер и дистрибьютор премиальной табачной продукции в Республике Казахстан.
              Прямой импорт и эксклюзивное представительство глобальных табачных производителей: высший стандарт качества на рынке Казахстана.
            </p>

            {/* Age Warning */}
            <Card className="bg-red-900/20 border-red-800/30 mb-10 max-w-xl mx-auto shadow-lg">
              <CardContent className="py-5 px-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                  <span className="text-3xl font-bold text-red-400">21+</span>
                </div>
                <p className="text-red-300/80 text-sm">
                  Данный сайт предназначен только для лиц, достигших 21 года.
                  Продажа табачных изделий несовершеннолетним запрещена законодательством РК.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold gap-2 w-full sm:w-auto text-lg px-8 py-6 shadow-xl shadow-gold-500/25">
                  Зарегистрироваться
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1E1E1E]">
                  У меня есть аккаунт
                </Button>
              </Link>
            </div>
            
            <p className="text-[#A0A0A0] mt-6 text-sm">
              Для просмотра каталога необходима регистрация и подтверждение возраста
            </p>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="border-y border-[#2A2A2A] bg-[#1E1E1E] py-8 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 sm:gap-8 md:gap-12 items-center justify-center flex-wrap">
            {brands.map((brand, i) => (
              <span key={i} className="text-[#A0A0A0]/50 text-sm sm:text-base md:text-xl font-semibold whitespace-nowrap hover:text-gold-500 transition-colors cursor-default">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-10 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] mb-4">Почему выбирают нас</h2>
          <p className="text-[#A0A0A0] max-w-2xl mx-auto">
            Высший стандарт качества на рынке Казахстана
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-[#1E1E1E] border-[#2A2A2A] hover:border-gold-500/30 hover:shadow-lg hover:shadow-gold-500/5 transition-all duration-300 group"
            >
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="text-[#F5F5F5] font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{feature.title}</h3>
                <p className="text-[#A0A0A0] text-xs sm:text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Kazakhstan delivery map */}
      <KazakhstanMap />

      {/* About & Payment */}
      <section className="bg-[#1E1E1E] py-10 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* About */}
            <Card className="bg-[#252525] border-[#2A2A2A] shadow-lg">
              <CardContent className="p-5 sm:p-6 md:p-8">
                <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6">О компании</h2>
                <div className="space-y-4 text-[#A0A0A0]">
                  <p>
                    ТОО Premium Tobacco — ведущий импортер и дистрибьютор премиальной табачной продукции 
                    в Республике Казахстан. Мы работаем с 2020 года, осуществляя прямые поставки от мировых лидеров отрасли.
                  </p>
                  <p>
                    Наш ассортимент включает табак для кальяна, сигареты, папиросы, трубочный табак, 
                    сигариллы, сигары и аксессуары.
                  </p>
                  <p>
                    Собственный склад в Астане — отгрузка день в день. 100% покрытие территории РК.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[#2A2A2A]">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gold-500/10 border-2 border-[#1E1E1E] flex items-center justify-center">
                        <Star className="h-4 w-4 text-gold-500 fill-gold-500" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[#F5F5F5] font-semibold">4.9 из 5</p>
                    <p className="text-[#A0A0A0] text-sm">Более 5000 отзывов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Delivery */}
            <div className="space-y-6">
              <Card className="bg-[#252525] border-[#2A2A2A] shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-900/30 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#F5F5F5]">Способы оплаты</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Безналичный расчёт (счёт на оплату)',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#A0A0A0]">
                        <ChevronRight className="h-4 w-4 text-gold-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-[#252525] border-[#2A2A2A] shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-900/30 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#F5F5F5]">Доставка</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      `Бесплатно при заказе от ${Number(freeDeliveryAmount).toLocaleString('ru-RU')} ₸`,
                      'Прямая логистика из Астаны',
                      `Доставка по Казахстану — ${deliveryDays} дней`,
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#A0A0A0]">
                        <ChevronRight className="h-4 w-4 text-gold-500" />
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
      <section className="container mx-auto px-4 py-10 sm:py-16 md:py-20">
        <Card className="bg-gradient-to-r from-gold-600 to-gold-500 border-0 shadow-2xl shadow-gold-500/30 overflow-hidden">
          <CardContent className="p-5 sm:p-8 md:p-12 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1E1E1E]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#121212] mb-4">
                Готовы сделать заказ?
              </h2>
              <p className="text-[#121212]/70 text-lg mb-8">
                Оформите первый заказ и оцените качество нашего сервиса!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-[#121212] text-gold-500 hover:bg-[#1E1E1E] gap-2 px-8">
                    Создать аккаунт
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href={`tel:${storePhone.replace(/[^+\d]/g, '')}`}>
                  <Button size="lg" variant="outline" className="border-[#121212]/30  hover:bg-[#121212]/10 gap-2 px-8">
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
        <Card className="bg-red-900/20 border-red-800/30">
          <CardContent className="py-4 px-4 sm:py-6 sm:px-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-red-400 font-bold text-sm sm:text-base md:text-lg mb-2">
                  ТЕМЕКІНІ ТҰТЫНУ ТӘУЕЛДІЛІКТІ, СОНДАЙ-АҚ АУЫР АУРУЛАРДЫ ТУДЫРАДЫ
                </h3>
                <p className="text-red-300/70 mb-2">
                  21 ЖАСҚА ТОЛМАҒАН ТҰЛҒАЛАРҒА САТУҒА ТЫЙЫМ САЛЫНАДЫ.
                </p>
                <p className="text-red-300/70">
                  Курение вызывает зависимость, а также тяжёлые заболевания.
                  Продажа лицам до 21 года запрещена.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2A] bg-[#0D0D0D] mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600">
                  <span className="text-sm font-bold text-[#121212]">{storeName.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-[#A0A0A0]">
                  © {new Date().getFullYear()} {storeName}
                </span>
              </Link>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6 text-sm flex-wrap justify-center md:justify-end">
              <Link href="/privacy" className="text-[#A0A0A0] hover:text-gold-500 transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="/terms" className="text-[#A0A0A0] hover:text-gold-500 transition-colors">
                Условия использования
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-lg">🇰🇿</span>
                <span className="text-red-500 font-bold">21+</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
