import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Phone,
  Mail,
  MapPin,
  Clock3,
  Building2,
  Truck,
  MessagesSquare,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tobaccotrade.kz';

export const metadata: Metadata = {
  title: 'Контакты | Tobacco Trade',
  description:
    'Контакты Tobacco Trade: телефоны для клиентов и поставщиков, email, адрес и время работы.',
  alternates: {
    canonical: '/contacts',
  },
  openGraph: {
    title: 'Контакты | Tobacco Trade',
    description: 'Официальные контакты Tobacco Trade для связи по заказам, поставкам и поддержке.',
    url: `${siteUrl}/contacts`,
    siteName: 'Tobacco Trade',
    type: 'website',
  },
};

const contacts = {
  clientPhone: '+7 (700) 800-18-00',
  supplierPhone: '+7 (705) 888-19-19',
  email: 'info@tobaccotrade.kz',
  supportEmail: 'noreply@tobaccotrade.kz',
  address: 'Казахстан, г. Астана',
  schedule: 'Пн-Пт: 09:00 - 19:00',
};

function digitsOnly(value: string): string {
  return value.replace(/[^+\d]/g, '');
}

export default function ContactsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tobacco Trade',
    url: siteUrl,
    email: contacts.email,
    telephone: contacts.clientPhone,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KZ',
      addressLocality: 'Астана',
      streetAddress: contacts.address,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: contacts.clientPhone,
        contactType: 'customer support',
        areaServed: 'KZ',
        availableLanguage: ['ru', 'kk'],
      },
      {
        '@type': 'ContactPoint',
        telephone: contacts.supplierPhone,
        contactType: 'sales',
        areaServed: 'KZ',
        availableLanguage: ['ru', 'kk'],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute -top-20 left-0 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-gold-500/5 blur-3xl" />

        <section className="container mx-auto px-4 pt-10 pb-6 md:pt-14 md:pb-10 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-gold-400 text-sm mb-5">
              <MessagesSquare className="h-4 w-4" />
              Связь с командой Tobacco Trade
            </div>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">Контакты</h1>
            <p className="text-[#A0A0A0] text-base md:text-lg max-w-3xl">
              Отдел продаж, поддержка клиентов и работа с поставщиками. Отвечаем быстро в рабочее время.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-14 md:pb-20">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A]/95 p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-500">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Клиентский отдел</h2>
              <a
                href={`tel:${digitsOnly(contacts.clientPhone)}`}
                className="text-lg text-[#F5F5F5] hover:text-gold-400 transition-colors"
              >
                {contacts.clientPhone}
              </a>
              <p className="text-[#A0A0A0] mt-2">Вопросы по заказам, оплате и доставке.</p>
            </article>

            <article className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A]/95 p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-500">
                <Building2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Поставщики и B2B</h2>
              <a
                href={`tel:${digitsOnly(contacts.supplierPhone)}`}
                className="text-lg text-[#F5F5F5] hover:text-gold-400 transition-colors"
              >
                {contacts.supplierPhone}
              </a>
              <p className="text-[#A0A0A0] mt-2">Сотрудничество, оптовые поставки и коммерческие условия.</p>
            </article>

            <article className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A]/95 p-6 md:col-span-2 xl:col-span-1">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-500">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Email</h2>
              <a href={`mailto:${contacts.email}`} className="block text-[#F5F5F5] hover:text-gold-400 transition-colors">
                {contacts.email}
              </a>
              <a
                href={`mailto:${contacts.supportEmail}`}
                className="block text-[#A0A0A0] hover:text-gold-400 transition-colors mt-1"
              >
                {contacts.supportEmail}
              </a>
              <p className="text-[#666] text-sm mt-2">Рекомендуем добавить адреса в контакты для надежной доставки писем.</p>
            </article>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] mt-6">
            <article className="rounded-2xl border border-[#2A2A2A] bg-[#181818]/95 p-6">
              <h2 className="text-2xl font-semibold mb-4">Офис и режим работы</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gold-500 mt-0.5" />
                  <div>
                    <p className="text-[#F5F5F5] font-medium">Адрес</p>
                    <p className="text-[#A0A0A0]">{contacts.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3 className="h-5 w-5 text-gold-500 mt-0.5" />
                  <div>
                    <p className="text-[#F5F5F5] font-medium">График</p>
                    <p className="text-[#A0A0A0]">{contacts.schedule}</p>
                    <p className="text-[#666] text-sm">Сб, Вс и праздники - выходной.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-gold-500 mt-0.5" />
                  <div>
                    <p className="text-[#F5F5F5] font-medium">Доставка</p>
                    <p className="text-[#A0A0A0]">По Астане и по всему Казахстану через партнерские службы.</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-gold-500/25 bg-gradient-to-br from-gold-500/10 to-[#1A1A1A] p-6">
              <h2 className="text-2xl font-semibold mb-3">Важная информация</h2>
              <ul className="space-y-3 text-[#E6E6E6]">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-gold-500 mt-0.5 flex-shrink-0" />
                  Продажа продукции только лицам старше 21 года.
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-gold-500 mt-0.5 flex-shrink-0" />
                  Перед отгрузкой менеджер подтверждает заказ по телефону.
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-gold-500 mt-0.5 flex-shrink-0" />
                  Для B2B сотрудничества подготовьте реквизиты компании.
                </li>
              </ul>

              <div className="mt-5 rounded-xl border border-[#2A2A2A] bg-[#121212]/60 p-4">
                <p className="text-[#A0A0A0] text-sm mb-2">Быстрый переход</p>
                <a
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 transition-colors"
                >
                  Политика конфиденциальности
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
