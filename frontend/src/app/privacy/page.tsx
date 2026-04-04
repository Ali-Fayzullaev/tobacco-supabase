import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, FileText, Clock3, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tobaccotrade.kz';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности | Tobacco Trade',
  description:
    'Политика конфиденциальности Tobacco Trade: какие данные мы собираем, как обрабатываем и защищаем персональную информацию клиентов.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Политика конфиденциальности | Tobacco Trade',
    description:
      'Правила обработки персональных данных клиентов Tobacco Trade и меры по их защите.',
    url: `${siteUrl}/privacy`,
    siteName: 'Tobacco Trade',
    type: 'article',
  },
};

const sections = [
  {
    id: 'what-we-collect',
    title: '1. Какие данные мы собираем',
    content: [
      'Контактные данные: имя, телефон, email, адрес доставки.',
      'Данные заказа: товары, сумма, статус и история операций.',
      'Технические данные: IP-адрес, user-agent, события безопасности для защиты от злоупотреблений.',
    ],
  },
  {
    id: 'why-we-collect',
    title: '2. Цели обработки данных',
    content: [
      'Оформление и сопровождение заказов, доставка и сервисная поддержка.',
      'Соблюдение требований законодательства и бухгалтерского учета.',
      'Защита платформы от ботов, мошенничества и несанкционированного доступа.',
    ],
  },
  {
    id: 'how-we-protect',
    title: '3. Как мы защищаем данные',
    content: [
      'Контроль доступа, журналирование критичных событий и ограничение попыток авторизации.',
      'Регулярное обновление программного обеспечения и базовых политик безопасности.',
      'Передача данных только по защищенным протоколам в рамках технической инфраструктуры проекта.',
    ],
  },
  {
    id: 'sharing',
    title: '4. Передача третьим лицам',
    content: [
      'Мы не продаем персональные данные.',
      'Данные передаются только сервисам, необходимым для работы магазина: платежи, доставка, инфраструктура.',
      'Передача осуществляется в рамках договорных обязательств и применимого законодательства.',
    ],
  },
  {
    id: 'rights',
    title: '5. Права пользователя',
    content: [
      'Запросить информацию о хранимых данных.',
      'Потребовать исправление неточных данных.',
      'Отозвать согласие и запросить удаление данных в случаях, предусмотренных законом.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute top-40 -left-20 h-72 w-72 rounded-full bg-gold-500/5 blur-3xl" />

        <section className="container mx-auto px-4 pt-10 pb-6 md:pt-14 md:pb-10 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-gold-400 text-sm mb-5">
              <ShieldCheck className="h-4 w-4" />
              Конфиденциальность и безопасность данных
            </div>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Политика конфиденциальности
            </h1>

            <p className="text-[#A0A0A0] text-base md:text-lg max-w-3xl">
              Мы обрабатываем персональные данные только для работы магазина, исполнения заказов и обеспечения безопасности.
              Ниже описаны основные принципы обработки и защиты информации.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E1E1E] px-3 py-1.5 text-[#A0A0A0] border border-[#2A2A2A]">
                <Clock3 className="h-4 w-4 text-gold-500" />
                Обновлено: 03.04.2026
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E1E1E] px-3 py-1.5 text-[#A0A0A0] border border-[#2A2A2A]">
                <Lock className="h-4 w-4 text-gold-500" />
                Только необходимые данные
              </span>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-14 md:pb-20">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-[#2A2A2A] bg-[#181818]/95 p-4">
              <p className="text-sm uppercase tracking-wide text-[#666] mb-3">Навигация</p>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-[#A0A0A0] hover:text-gold-400 hover:bg-gold-500/10 transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="space-y-5">
              {sections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A]/95 p-5 md:p-6"
                >
                  <h2 className="text-xl md:text-2xl font-semibold mb-3">{section.title}</h2>
                  <ul className="space-y-2.5">
                    {section.content.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[#C0C0C0]">
                        <CheckCircle2 className="h-4 w-4 mt-1 text-gold-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}

              <article className="rounded-2xl border border-red-700/30 bg-red-900/10 p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-300 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-red-200 mb-2">Возрастные ограничения</h2>
                    <p className="text-red-100/90">
                      Сайт предназначен только для лиц 21+. Продажа табачной продукции несовершеннолетним запрещена.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A]/95 p-5 md:p-6">
                <h2 className="text-xl font-semibold mb-3">Связаться по вопросам данных</h2>
                <p className="text-[#A0A0A0] mb-4">
                  Если у вас есть запросы по персональным данным, напишите нам в поддержку.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="mailto:info@tobaccotrade.kz"
                    className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-[#121212] font-medium hover:bg-gold-600 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    info@tobaccotrade.kz
                  </a>
                  <Link
                    href="/contacts"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2A] px-4 py-2.5 text-[#F5F5F5] hover:border-gold-500/40 hover:text-gold-400 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Перейти в контакты
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
