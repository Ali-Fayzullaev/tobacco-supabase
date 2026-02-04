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
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещён</h1>
          <p className="text-gray-500 mb-6">
            У вас нет прав для доступа к админ-панели.
          </p>
          <Link
            href="/"
            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-slate-900 text-white h-16 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
            >
              {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/admin" className="text-xl font-bold text-gold-500">
              Admin Panel
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-300 hover:text-white text-sm">
              На сайт
            </Link>
            <div className="hidden sm:block text-sm text-gray-400">
              {profile?.first_name} {profile?.last_name}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-slate-800 rounded-lg"
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
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform pt-16 lg:pt-0 ${
            showMobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileNav(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gold-50 text-gold-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {showMobileNav && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setShowMobileNav(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
