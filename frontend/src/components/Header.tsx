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
  ChevronDown,
  Truck,
  Bell,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut, profile } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { settings } = useStoreSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Уведомления
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const storeName = settings.store_name || 'Shop Shop';
  const storePhone = settings.store_phone || '+7 (777) 123-45-67';
  const freeDeliveryAmount = settings.free_delivery_threshold || '15000';

  // Загрузка уведомлений
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      // Обновляем каждые 30 секунд
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setNotifications(data || []);
    } catch (error) {
      // Таблица уведомлений ещё не создана
      console.log('Notifications not available');
    }
  };

  const markAsRead = async (notificationId: string) => {
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const supabase = createBrowserSupabaseClient();
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
                <span className="text-xl font-bold text-gray-900">Shop</span>
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
                  {/* Notifications */}
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "relative text-gray-600 hover:text-orange-600 hover:bg-orange-50",
                        showNotifications && "bg-orange-50 text-orange-600"
                      )}
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowNotifications(false)} 
                        />
                        
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Bell className="w-4 h-4 text-orange-500" />
                              Уведомления
                            </h3>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                              >
                                Прочитать все
                              </button>
                            )}
                          </div>
                          <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-gray-500">
                                <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">Нет уведомлений</p>
                                <p className="text-sm text-gray-400 mt-1">Здесь будут важные сообщения</p>
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  onClick={() => markAsRead(notification.id)}
                                  className={cn(
                                    "p-4 border-b border-gray-50 cursor-pointer transition-all",
                                    !notification.is_read 
                                      ? "bg-orange-50/70 hover:bg-orange-50" 
                                      : "hover:bg-gray-50"
                                  )}
                                >
                                  <div className="flex gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                      notification.type === 'product_deleted' 
                                        ? "bg-red-100" 
                                        : "bg-blue-100"
                                    )}>
                                      {notification.type === 'product_deleted' ? (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                      ) : (
                                        <Bell className="w-5 h-5 text-blue-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn(
                                        "font-medium text-sm",
                                        !notification.is_read ? "text-gray-900" : "text-gray-600"
                                      )}>
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-2">
                                        {formatDate(notification.created_at)}
                                      </p>
                                    </div>
                                    {!notification.is_read && (
                                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0 mt-1 animate-pulse" />
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-100 bg-gray-50">
                              <Link 
                                href="/profile/orders"
                                onClick={() => setShowNotifications(false)}
                                className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                              >
                                Смотреть все заказы →
                              </Link>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

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
                      signOut();
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
