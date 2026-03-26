'use client';

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
import { useStoreSettings } from '@/hooks/useStoreSettings';

export function Footer() {
  const { settings } = useStoreSettings();
  
  const storeName = settings.store_name || 'Premium Tobacco';
  const storePhone = settings.store_phone || '+7 (700) 800-18-00';
  const storePhoneSuppliers = settings.store_phone_suppliers || '+7 (705) 888-19-19';
  const storeEmail = settings.store_email || 'premiumtobacco.info@gmail.com';
  const storeAddress = settings.store_address || 'г. Астана';
  const freeDeliveryAmount = settings.free_delivery_threshold || '200000';
  const storeSchedule = settings.store_schedule || 'Пн-Пт: 09:00 – 19:00';
  const franchiseUrl = settings.franchise_url || '';

  // Формируем список способов оплаты на основе настроек
  const paymentMethods: string[] = [];
  if (settings.payment_invoice) paymentMethods.push('счёт на оплату');
  if (settings.payment_kaspi) paymentMethods.push('Kaspi');
  if (settings.payment_card) paymentMethods.push('карты');
  if (settings.payment_cash) paymentMethods.push('наличные');
  const paymentText = paymentMethods.length > 0 ? paymentMethods.join(', ') : 'Безналичный расчёт';

  return (
    <footer className="bg-[#0D0D0D] text-[#F5F5F5]">
      {/* Features bar */}
      <div className="bg-gradient-to-r from-gold-600 to-gold-500">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 text-[#121212]">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div>
                <p className="font-medium text-xs sm:text-sm">Бесплатная доставка</p>
                <p className="text-[10px] sm:text-xs text-[#121212]/70">от {Number(freeDeliveryAmount).toLocaleString('ru-RU')} ₸</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[#121212]">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div>
                <p className="font-medium text-xs sm:text-sm">Удобная оплата</p>
                <p className="text-[10px] sm:text-xs text-[#121212]/70">{paymentText}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[#121212]">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div>
                <p className="font-medium text-xs sm:text-sm">Гарантия качества</p>
                <p className="text-[10px] sm:text-xs text-[#121212]/70">Только оригинал</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[#121212]">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div>
                <p className="font-medium text-xs sm:text-sm">Поддержка 24/7</p>
                <p className="text-[10px] sm:text-xs text-[#121212]/70">{storePhone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600">
                <span className="text-lg font-bold text-[#121212]">{storeName.charAt(0)}</span>
              </div>
              <div>
                <span className="text-lg font-bold text-[#F5F5F5]">{storeName.split(' ')[0] || 'Shop'}</span>
                <span className="text-lg font-bold text-gold-500">{storeName.split(' ').slice(1).join(' ') || 'Shop'}</span>
              </div>
            </Link>
            <p className="text-[#666] text-sm mb-4">
              {settings.store_description || 'Премиальные табачные изделия от лучших мировых производителей.'}
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E1E1E] text-[#A0A0A0] hover:bg-gold-500 hover:text-[#121212] transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E1E1E] text-[#A0A0A0] hover:bg-gold-500 hover:text-[#121212] transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="text-[#F5F5F5] font-semibold mb-4">Каталог</h3>
            <ul className="space-y-2">
              {[
                { href: '/catalog?category=hookah-tobacco', label: 'Табак для кальяна' },
                { href: '/catalog?category=cigarettes', label: 'Сигареты' },
                { href: '/catalog?category=papirosy', label: 'Папиросы' },
                { href: '/catalog?category=pipe-tobacco', label: 'Трубочный табак' },
                { href: '/catalog?category=smoking-tobacco', label: 'Табак курительный' },
                { href: '/catalog?category=cigarillos', label: 'Сигариллы' },
                { href: '/catalog?category=cigars', label: 'Сигары' },
                { href: '/catalog?category=accessories', label: 'Аксессуары' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-[#A0A0A0] hover:text-gold-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-[#F5F5F5] font-semibold mb-4">Информация</h3>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'О компании' },
                { href: '/delivery', label: 'Доставка и оплата' },
                { href: '/warranty', label: 'Гарантии' },
                { href: '/contacts', label: 'Контакты' },
                { href: '/privacy', label: 'Политика конфиденциальности' },
                ...(franchiseUrl ? [{ href: franchiseUrl, label: 'Tobacco Club (франшиза)' }] : []),
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    prefetch={false}
                    className="text-[#A0A0A0] hover:text-gold-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-[#F5F5F5] font-semibold mb-4">Контакты</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href={`tel:${storePhone.replace(/[^+\d]/g, '')}`}
                  className="flex items-center gap-3 text-[#A0A0A0] hover:text-gold-500 transition-colors"
                >
                  <Phone className="h-4 w-4 text-gold-500" />
                  <div>
                    <span className="text-sm">{storePhone}</span>
                    <span className="text-xs text-[#666] block">Клиенты</span>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href={`tel:${storePhoneSuppliers.replace(/[^+\d]/g, '')}`}
                  className="flex items-center gap-3 text-[#A0A0A0] hover:text-gold-500 transition-colors"
                >
                  <Phone className="h-4 w-4 text-gold-500" />
                  <div>
                    <span className="text-sm">{storePhoneSuppliers}</span>
                    <span className="text-xs text-[#666] block">Поставщики</span>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href={`mailto:${storeEmail}`}
                  className="flex items-center gap-3 text-[#A0A0A0] hover:text-gold-500 transition-colors"
                >
                  <Mail className="h-4 w-4 text-gold-500" />
                  <span className="text-sm">{storeEmail}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-[#A0A0A0]">
                <MapPin className="h-4 w-4 text-gold-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{storeAddress}</span>
              </li>
            </ul>
            
            <div className="mt-4 p-3 rounded-lg bg-[#1E1E1E]">
              <p className="text-sm text-[#F5F5F5] font-medium">Режим работы:</p>
              <p className="text-sm text-[#A0A0A0]">{storeSchedule}</p>
              <p className="text-xs text-[#666]">Сб, Вс и праздники — выходной</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-red-900/50 border-t border-red-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col items-center gap-1 text-red-300 text-xs sm:text-sm text-center">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span className="font-semibold">ТЕМЕКІНІ ТҰТЫНУ ТӘУЕЛДІЛІКТІ, СОНДАЙ-АҚ АУЫР АУРУЛАРДЫ ТУДЫРАДЫ. 21 ЖАСҚА ТОЛМАҒАН ТҰЛҒАЛАРҒА САТУҒА ТЫЙЫМ САЛЫНАДЫ.</span>
            </div>
            <span>Курение вредит вашему здоровью. Продажа лицам до 21 года запрещена.</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-[#1E1E1E]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#A0A0A0] text-sm">
              © {new Date().getFullYear()} {storeName}. Все права защищены.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#A0A0A0] text-sm">
                <span className="text-lg">🇰🇿</span>
                <span>Казахстан</span>
              </div>
              <div className="h-4 w-px bg-gray-700" />
              <span className="text-red-500 font-bold text-lg">21+</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
