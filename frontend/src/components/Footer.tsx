import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  MessageCircle,
  AlertTriangle,
  CreditCard,
  Truck,
  Shield
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Features bar */}
      <div className="bg-orange-500">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <div className="flex items-center gap-3 text-white">
              <Truck className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Бесплатная доставка</p>
                <p className="text-xs text-orange-100">от 15 000 ₸</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <CreditCard className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Удобная оплата</p>
                <p className="text-xs text-orange-100">Kaspi, карты, наличные</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Shield className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Гарантия качества</p>
                <p className="text-xs text-orange-100">Только оригинал</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Phone className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Поддержка 24/7</p>
                <p className="text-xs text-orange-100">+7 (777) 123-45-67</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <div>
                <span className="text-lg font-bold text-white">Tobacco</span>
                <span className="text-lg font-bold text-orange-500">Shop</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Премиальные табачные изделия от лучших мировых производителей. 
              Работаем с 2024 года.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-orange-500 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-orange-500 hover:text-white transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="text-white font-semibold mb-4">Каталог</h3>
            <ul className="space-y-2">
              {[
                { href: '/catalog?category=cigarettes', label: 'Сигареты' },
                { href: '/catalog?category=cigars', label: 'Сигары' },
                { href: '/catalog?category=tobacco', label: 'Табак' },
                { href: '/catalog?category=e-cigarettes', label: 'Электронные сигареты' },
                { href: '/catalog?category=accessories', label: 'Аксессуары' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Информация</h3>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'О компании' },
                { href: '/delivery', label: 'Доставка и оплата' },
                { href: '/warranty', label: 'Гарантии' },
                { href: '/contacts', label: 'Контакты' },
                { href: '/privacy', label: 'Политика конфиденциальности' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-white font-semibold mb-4">Контакты</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="tel:+77771234567" 
                  className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Phone className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">+7 (777) 123-45-67</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@tobacco.kz" 
                  className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Mail className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">info@tobacco.kz</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">г. Алматы, ул. Абая 150, офис 312</span>
              </li>
            </ul>
            
            <div className="mt-4 p-3 rounded-lg bg-gray-800">
              <p className="text-sm text-white font-medium">Режим работы:</p>
              <p className="text-sm text-gray-400">Пн-Вс: 09:00 - 21:00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-red-900/50 border-t border-red-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-red-300 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Курение вредит вашему здоровью. Продажа лицам до 18 лет запрещена.</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 Tobacco Shop KZ. Все права защищены.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="text-lg">🇰🇿</span>
                <span>Казахстан</span>
              </div>
              <div className="h-4 w-px bg-gray-700" />
              <span className="text-red-500 font-bold text-lg">18+</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
