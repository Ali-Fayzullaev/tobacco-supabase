import Link from 'next/link';
import { 
  ShieldCheck, 
  Truck, 
  Package, 
  Clock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gold-500">
            Tobacco Shop KZ
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-white hover:text-gold-400 transition-colors"
            >
              Войти
            </Link>
            <Link 
              href="/register" 
              className="bg-gold-500 hover:bg-gold-600 text-slate-900 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Регистрация
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Премиальные табачные изделия
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Широкий ассортимент качественной продукции от ведущих мировых брендов.
            Быстрая доставка по Казахстану.
          </p>
          
          {/* Age Warning */}
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 mb-8 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <span className="text-xl font-bold text-red-400">18+</span>
            </div>
            <p className="text-red-200 text-sm">
              Данный сайт предназначен только для лиц, достигших 18-летнего возраста.
              Продажа табачных изделий несовершеннолетним запрещена законодательством РК.
            </p>
          </div>

          <Link 
            href="/register"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            Зарегистрироваться
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <p className="text-gray-400 mt-4 text-sm">
            Для просмотра каталога необходима регистрация
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="bg-slate-800/50 rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-gold-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">Оригинальная продукция</h3>
            <p className="text-gray-400 text-sm">
              Только сертифицированные товары от официальных дистрибьюторов
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-7 h-7 text-gold-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">Быстрая доставка</h3>
            <p className="text-gray-400 text-sm">
              Доставка по Алматы за 2 часа, по Казахстану — 1-3 дня
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-gold-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">Широкий ассортимент</h3>
            <p className="text-gray-400 text-sm">
              Более 500 наименований сигарет, вейпов, кальянов и аксессуаров
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-gold-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">Работаем 24/7</h3>
            <p className="text-gray-400 text-sm">
              Принимаем заказы круглосуточно, онлайн поддержка
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-slate-800/30 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white mb-6">О нашем магазине</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-300 mb-4">
                Tobacco Shop KZ — ведущий интернет-магазин табачных изделий в Казахстане. 
                Мы работаем с 2020 года и за это время заслужили доверие тысяч клиентов.
              </p>
              <p className="text-gray-300 mb-4">
                Наш ассортимент включает сигареты, сигары, табак для кальяна, 
                электронные сигареты и вейпы, а также аксессуары от лучших мировых производителей.
              </p>
              <p className="text-gray-300">
                Мы гарантируем подлинность всей продукции и соблюдение условий хранения.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Способы оплаты:</h3>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold-500 rounded-full"></span>
                  Kaspi перевод
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold-500 rounded-full"></span>
                  Банковские карты (Visa, MasterCard)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold-500 rounded-full"></span>
                  Наличными при получении
                </li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-4">Доставка:</h3>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold-500 rounded-full"></span>
                  Курьером по городу
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold-500 rounded-full"></span>
                  Самовывоз из магазина
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Health Warning */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-6">
          <h3 className="text-red-300 font-bold text-lg mb-2">
            ⚠️ ПРЕДУПРЕЖДЕНИЕ МИНИСТЕРСТВА ЗДРАВООХРАНЕНИЯ РК
          </h3>
          <p className="text-red-200">
            Курение вызывает рак лёгких и другие заболевания. 
            Никотин вызывает привыкание. Продажа табачных изделий лицам младше 18 лет запрещена.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-slate-700 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © 2024 Tobacco Shop KZ. Все права защищены.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">
              Условия использования
            </Link>
            <Link href="/contacts" className="text-gray-400 hover:text-white">
              Контакты
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
