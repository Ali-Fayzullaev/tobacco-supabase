'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  X, 
  LogOut,
  Package,
  Settings,
  Search,
  Phone,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, profile } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = profile?.role === 'admin';

  const categories = [
    { href: '/catalog?category=cigarettes', label: 'Сигареты' },
    { href: '/catalog?category=cigars', label: 'Сигары' },
    { href: '/catalog?category=tobacco', label: 'Табак' },
    { href: '/catalog?category=e-cigarettes', label: 'Электронные сигареты' },
    { href: '/catalog?category=accessories', label: 'Аксессуары' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalog?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex h-9 items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                +7 (777) 123-45-67
              </span>
              <span className="hidden md:block">🚚 Бесплатная доставка от 15 000 ₸</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block">Работаем: 09:00 - 21:00</span>
              <span className="text-orange-200">|</span>
              <span>🇰🇿 Казахстан</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4 lg:gap-8">
            {/* Logo */}
            <Link href={isAuthenticated ? '/catalog' : '/'} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-gray-900">Tobacco</span>
                <span className="text-xl font-bold text-orange-500">Shop</span>
              </div>
            </Link>

            {/* Catalog Button */}
            <div className="hidden lg:block">
              <Link href="/catalog">
                <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                  <Menu className="h-4 w-4" />
                  Каталог
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-300"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {isAuthenticated ? (
                <>
                  {/* Favorites */}
                  <Link href="/profile?tab=favorites">
                    <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-orange-600 hover:bg-orange-50">
                      <Heart className="h-5 w-5" />
                      {favorites.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {favorites.length}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {/* Cart */}
                  <Link href="/cart">
                    <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-orange-600 hover:bg-orange-50">
                      <ShoppingCart className="h-5 w-5" />
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {totalItems > 99 ? '99+' : totalItems}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {/* User menu */}
                  <Link href="/profile">
                    <Button variant="ghost" className="hidden sm:flex gap-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50">
                      <User className="h-5 w-5" />
                      <span className="hidden lg:inline max-w-[100px] truncate">
                        {profile?.first_name || 'Профиль'}
                      </span>
                    </Button>
                  </Link>

                  {isAdmin && (
                    <Link href="/admin" className="hidden md:block">
                      <Button variant="outline" size="sm" className="gap-1 border-orange-200 text-orange-600 hover:bg-orange-50">
                        <Settings className="h-4 w-4" />
                        Админ
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-orange-600">
                      Войти
                    </Button>
                  </Link>
                  <Link href="/register" className="hidden sm:block">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Регистрация
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      <nav className="hidden lg:block bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 h-12">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  pathname.includes(cat.href.split('=')[1])
                    ? "bg-orange-100 text-orange-700" 
                    : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                )}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-1">
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 bg-orange-50 rounded-lg"
              >
                <Menu className="h-5 w-5 text-orange-500" />
                Каталог
              </Link>
              
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                >
                  {cat.label}
                </Link>
              ))}
              
              {isAuthenticated && (
                <>
                  <div className="my-2 border-t border-gray-100" />
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                  >
                    <User className="h-5 w-5" />
                    Профиль
                  </Link>
                  <Link
                    href="/profile?tab=orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                  >
                    <Package className="h-5 w-5" />
                    Мои заказы
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 rounded-lg"
                    >
                      <Settings className="h-5 w-5" />
                      Админ-панель
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-lg w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Выйти
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
