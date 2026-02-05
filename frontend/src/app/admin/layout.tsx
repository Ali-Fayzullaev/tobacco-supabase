'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Store,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Товары', icon: Package },
  { href: '/admin/orders', label: 'Заказы', icon: ShoppingBag },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, isLoading } = useAuth();
  const [showMobileNav, setShowMobileNav] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
          <p className="text-gray-500 mt-3">Загрузка админ-панели...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Доступ запрещён</h1>
          <p className="text-gray-500 mb-6">
            У вас нет прав для доступа к админ-панели. Обратитесь к администратору.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-xl font-medium transition-colors"
          >
            <Store className="w-5 h-5" />
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white h-16 fixed top-0 left-0 right-0 z-50 shadow-lg">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white text-sm bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <Store className="w-4 h-4" />
              На сайт
            </Link>
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                {profile?.first_name?.[0] || 'A'}
              </div>
              <div className="text-sm">
                <p className="font-medium">{profile?.first_name}</p>
                <p className="text-xs text-gray-400">Администратор</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out pt-16 lg:pt-0 border-r border-gray-100",
            showMobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="p-4 lg:p-5">
            {/* Logo for sidebar (mobile) */}
            <div className="lg:hidden mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Admin Panel</p>
                  <p className="text-xs text-gray-400">Управление магазином</p>
                </div>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = item.exact 
                  ? pathname === item.href 
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileNav(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform",
                      !isActive && "group-hover:scale-110"
                    )} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom card */}
            <div className="mt-8 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl text-white">
              <p className="text-sm font-medium mb-1">Нужна помощь?</p>
              <p className="text-xs text-gray-400 mb-3">Документация и поддержка</p>
              <button className="w-full text-xs bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-colors">
                Открыть справку
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {showMobileNav && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setShowMobileNav(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
