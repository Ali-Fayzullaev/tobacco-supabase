'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Search, ShoppingCart, MessageCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/hooks/useCart';
import { SearchOverlay } from '@/components/SearchOverlay';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);

  // Анимация бейджа корзины при добавлении товара
  const [cartBounce, setCartBounce] = useState(false);
  const prevItems = useRef(totalItems);
  useEffect(() => {
    if (totalItems > prevItems.current) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 600);
      return () => clearTimeout(t);
    }
    prevItems.current = totalItems;
  }, [totalItems]);

  // Скрываем на admin-страницах, login, register
  if (
    pathname.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-email' ||
    pathname.startsWith('/auth')
  ) {
    return null;
  }

  const whatsappUrl = 'https://wa.me/77008001800';

  type TabDef = {
    key: string;
    href?: string;
    label: string;
    icon: typeof ShoppingBag;
    isActive: boolean;
    badge: number;
    bounce: boolean;
    external?: boolean;
    action?: () => void;
  };

  const tabs: TabDef[] = [
    {
      key: 'catalog',
      href: '/catalog',
      label: 'Каталог',
      icon: ShoppingBag,
      isActive: pathname.startsWith('/catalog') || pathname.startsWith('/product/'),
      badge: 0,
      bounce: false,
    },
    {
      key: 'search',
      label: 'Поиск',
      icon: Search,
      isActive: false,
      badge: 0,
      bounce: false,
      action: () => setSearchOpen(true),
    },
    {
      key: 'cart',
      href: '/cart',
      label: 'Корзина',
      icon: ShoppingCart,
      isActive: pathname === '/cart' || pathname === '/checkout',
      badge: totalItems,
      bounce: cartBounce,
    },
    {
      key: 'whatsapp',
      href: whatsappUrl,
      label: 'WhatsApp',
      icon: MessageCircle,
      isActive: false,
      badge: 0,
      bounce: false,
      external: true,
    },
  ];

  return (
    <>
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        role="navigation"
        aria-label="Мобильная навигация"
      >
        <div className="absolute inset-0 bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-[#2A2A2A]" />

        <div className="relative flex items-stretch justify-around px-1 py-0 safe-area-bottom">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const content = (
              <>
                {tab.isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold-500 rounded-full" />
                )}

                <span className={cn('relative transition-transform', tab.bounce && 'animate-cart-pop')}>
                  <Icon className={cn(
                    'w-6 h-6',
                    tab.isActive && 'stroke-[2.5]',
                    tab.key === 'whatsapp' && 'text-green-500'
                  )} />
                  {tab.badge > 0 && (
                    <span className={cn(
                      "absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none",
                      tab.bounce && "animate-cart-pop"
                    )}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </span>

                <span className={cn(
                  'text-[10px] leading-tight font-medium',
                  tab.isActive ? 'text-gold-500' : 'text-[#666]',
                  tab.key === 'whatsapp' && !tab.isActive && 'text-green-600'
                )}>
                  {tab.label}
                </span>
              </>
            );

            // Button tab (search)
            if (tab.action) {
              return (
                <button
                  key={tab.key}
                  onClick={tab.action}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[44px] relative transition-colors text-[#666] active:text-[#999]"
                >
                  {content}
                </button>
              );
            }

            // External link tab (whatsapp)
            if (tab.external) {
              return (
                <a
                  key={tab.key}
                  href={tab.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[44px] relative transition-colors text-[#666] active:text-[#999]"
                >
                  {content}
                </a>
              );
            }

            // Normal link tab
            return (
              <Link
                key={tab.key}
                href={tab.href!}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[44px] relative transition-colors',
                  tab.isActive
                    ? 'text-gold-500'
                    : 'text-[#666] active:text-[#999]'
                )}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
