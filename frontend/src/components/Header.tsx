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
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchOverlay } from '@/components/SearchOverlay';
import { cn, formatDate } from '@/lib/utils';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut, profile } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();

  // Bounce-анимация корзины при добавлении товара
  const [cartBounce, setCartBounce] = useState(false);
  const prevTotalItems = useRef(totalItems);
  useEffect(() => {
    if (totalItems > prevTotalItems.current) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 600);
      return () => clearTimeout(t);
    }
    prevTotalItems.current = totalItems;
  }, [totalItems]);
  const { settings } = useStoreSettings();
  const { parentCategories } = useCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Уведомления
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const storeName = settings.store_name || 'Premium Tobacco';
  const storePhone = settings.store_phone || '+7 (700) 800-18-00';
  const freeDeliveryAmount = settings.free_delivery_threshold || '200000';

  // Загрузка уведомлений (пауза на неактивной вкладке)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    loadNotifications();

    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(loadNotifications, 30000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        loadNotifications(); // сразу обновляем при возврате
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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

  const categories = parentCategories
    .filter(c => c.is_active)
    .map(c => ({ href: `/catalog?category=${c.slug}`, label: c.name }));

  return (
    <header className="sticky top-0 z-50 bg-[#1E1E1E] shadow-lg shadow-black/20 border-b border-[#2A2A2A]">
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Main header */}
      <div className="border-b border-[#2A2A2A]">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4 lg:gap-8">
            {/* Logo */}
            <Link href={isAuthenticated ? '/catalog' : '/'} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-lg shadow-gold-500/25">
                <span className="text-lg font-bold text-[#121212]">T</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-[#F5F5F5]">Shop</span>
                <span className="text-xl font-bold text-gold-500">Shop</span>
              </div>
            </Link>

            {/* Catalog Button */}
            <div className="hidden lg:block">
              <Link href="/catalog">
                <Button className="bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold gap-2">
                  <Menu className="h-4 w-4" />
                  Каталог
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-1 min-w-0 max-w-xl"
              aria-label="Поиск товаров"
            >
              <div className="relative flex items-center h-11 bg-[#121212] border border-[#2A2A2A] rounded-md px-3 gap-2 hover:border-gold-500/40 transition-colors cursor-pointer">
                <Search className="h-5 w-5 text-[#A0A0A0] flex-shrink-0" />
                <span className="text-[#A0A0A0] text-sm hidden sm:inline">Поиск товаров...</span>
                <span className="text-[#A0A0A0] text-sm sm:hidden">Поиск...</span>
              </div>
            </button>

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
                        "relative text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10",
                        showNotifications && "bg-gold-500/10 text-gold-500"
                      )}
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowUserMenu(false);
                      }}
                      aria-label={`Уведомления${unreadCount > 0 ? ` (${unreadCount} непрочитанных)` : ''}`}
                      aria-haspopup="true"
                      aria-expanded={showNotifications}
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-900/200 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
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
                        
                        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-[24rem] bg-[#1E1E1E] rounded-2xl shadow-2xl border border-[#2A2A2A] z-50 overflow-hidden">
                          <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#252525]">
                            <h3 className="font-semibold text-[#F5F5F5] flex items-center gap-2">
                              <Bell className="w-4 h-4 text-gold-500" />
                              Уведомления
                            </h3>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="text-sm text-gold-500 hover:text-gold-400 font-medium"
                              >
                                Прочитать все
                              </button>
                            )}
                          </div>
                          <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-[#A0A0A0]">
                                <Bell className="w-10 h-10 mx-auto mb-3 text-[#3A3A3A]" />
                                <p className="font-medium">Нет уведомлений</p>
                                <p className="text-sm text-[#666] mt-1">Здесь будут важные сообщения</p>
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  onClick={() => markAsRead(notification.id)}
                                  className={cn(
                                    "p-4 border-b border-[#2A2A2A] cursor-pointer transition-all",
                                    !notification.is_read 
                                      ? "bg-gold-500/5 hover:bg-gold-500/10" 
                                      : "hover:bg-[#252525]"
                                  )}
                                >
                                  <div className="flex gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                      notification.type === 'product_deleted' 
                                        ? "bg-red-900/30" 
                                        : "bg-blue-900/30"
                                    )}>
                                      {notification.type === 'product_deleted' ? (
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                      ) : (
                                        <Bell className="w-5 h-5 text-blue-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn(
                                        "font-medium text-sm",
                                        !notification.is_read ? "text-[#F5F5F5]" : "text-[#A0A0A0]"
                                      )}>
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-[#A0A0A0] mt-1 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-[#666] mt-2">
                                        {formatDate(notification.created_at)}
                                      </p>
                                    </div>
                                    {!notification.is_read && (
                                      <div className="w-2.5 h-2.5 bg-gold-500 rounded-full shrink-0 mt-1 animate-pulse" />
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          {notifications.length > 0 && (
                            <div className="p-3 border-t border-[#2A2A2A] bg-[#252525]">
                              <Link 
                                href="/profile/orders"
                                onClick={() => setShowNotifications(false)}
                                className="block text-center text-sm text-gold-500 hover:text-gold-400 font-medium"
                              >
                                Смотреть все заказы →
                              </Link>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Favorites — скрыто на мобилке (есть в MobileTabBar) */}
                  <Link href="/profile/favorites" className="hidden lg:block">
                    <Button variant="ghost" size="icon" className="relative text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10" aria-label={`Избранное${favorites.length > 0 ? ` (${favorites.length})` : ''}`}>
                      <Heart className="h-5 w-5" />
                      {favorites.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {favorites.length}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {/* Cart — скрыто на мобилке (есть в MobileTabBar) */}
                  <Link href="/cart" className="hidden lg:block">
                    <Button variant="ghost" size="icon" className={cn("relative text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10", cartBounce && "animate-cart-pop")} aria-label={`Корзина${totalItems > 0 ? ` (${totalItems})` : ''}`}>
                      <ShoppingCart className="h-5 w-5" />
                      {totalItems > 0 && (
                        <span className={cn("absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center", cartBounce && "animate-cart-pop")}>
                          {totalItems > 99 ? '99+' : totalItems}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {/* User menu */}
                  <div className="relative hidden sm:block">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={cn(
                        "relative text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10",
                        showUserMenu && "bg-gold-500/10 text-gold-500"
                      )}
                      onClick={() => {
                        setShowUserMenu(!showUserMenu);
                        setShowNotifications(false);
                      }}
                      aria-label="Профиль"
                      aria-haspopup="true"
                      aria-expanded={showUserMenu}
                    >
                      <User className="h-5 w-5" />
                    </Button>

                    {showUserMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowUserMenu(false)} 
                        />
                        <div className="absolute right-0 mt-2 w-64 bg-[#1E1E1E] rounded-2xl shadow-2xl border border-[#2A2A2A] z-50 overflow-hidden">
                          {/* User info */}
                          <div className="p-4 border-b border-[#2A2A2A] bg-[#252525]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-gold-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-[#F5F5F5] truncate">
                                  {profile?.first_name || 'Пользователь'}
                                </p>
                                <p className="text-xs text-[#A0A0A0] truncate">
                                  {user?.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="py-2">
                            <Link
                              href="/profile"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A0A0A0] hover:bg-gold-500/10 hover:text-gold-500 transition-colors"
                            >
                              <User className="w-4 h-4" />
                              Мой профиль
                            </Link>
                            <Link
                              href="/profile/orders"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A0A0A0] hover:bg-gold-500/10 hover:text-gold-500 transition-colors"
                            >
                              <Package className="w-4 h-4" />
                              Мои заказы
                            </Link>
                            <Link
                              href="/profile/favorites"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A0A0A0] hover:bg-gold-500/10 hover:text-gold-500 transition-colors"
                            >
                              <Heart className="w-4 h-4" />
                              Избранное
                            </Link>
                            <Link
                              href="/profile/settings"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A0A0A0] hover:bg-gold-500/10 hover:text-gold-500 transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              Настройки
                            </Link>
                            {isAdmin && (
                              <>
                                <div className="my-1 border-t border-[#2A2A2A]" />
                                <Link
                                  href="/admin"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold-500 hover:bg-gold-500/10 transition-colors"
                                >
                                  <Settings className="w-4 h-4" />
                                  Админ-панель
                                </Link>
                              </>
                            )}
                          </div>

                          {/* Logout */}
                          <div className="border-t border-[#2A2A2A]">
                            <button
                              onClick={() => {
                                signOut();
                                setShowUserMenu(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors w-full"
                            >
                              <LogOut className="w-4 h-4" />
                              Выйти
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10">
                      Войти
                    </Button>
                  </Link>
                  <Link href="/register" className="hidden sm:block">
                    <Button className="bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold">
                      Регистрация
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[#A0A0A0]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#1E1E1E] border-t border-[#2A2A2A] shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-1">
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-[#F5F5F5] bg-gold-500/10 rounded-lg"
              >
                <Menu className="h-5 w-5 text-gold-500" />
                Каталог
              </Link>
              
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10 rounded-lg"
                >
                  {cat.label}
                </Link>
              ))}
              
              {isAuthenticated && (
                <>
                  <div className="my-2 border-t border-[#2A2A2A]" />
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10 rounded-lg"
                  >
                    <User className="h-5 w-5" />
                    Профиль
                  </Link>
                  <Link
                    href="/profile/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#A0A0A0] hover:text-gold-500 hover:bg-gold-500/10 rounded-lg"
                  >
                    <Package className="h-5 w-5" />
                    Мои заказы
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gold-500 hover:bg-gold-500/10 rounded-lg"
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
                    className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 rounded-lg w-full text-left"
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
