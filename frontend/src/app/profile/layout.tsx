'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  User, 
  Package, 
  Heart, 
  Settings, 
  LogOut,
  Menu,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks';

const navItems = [
  { href: '/profile', label: 'Профиль', icon: User },
  { href: '/profile/orders', label: 'Мои заказы', icon: Package },
  { href: '/profile/favorites', label: 'Избранное', icon: Heart },
  { href: '/profile/settings', label: 'Настройки', icon: Settings },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, isLoading } = useAuth();
  const [showMobileNav, setShowMobileNav] = useState(false);

  const isAdult = profile?.birth_date && 
    new Date(profile.birth_date) <= new Date(new Date().setFullYear(new Date().getFullYear() - 21));

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#F5F5F5] mb-4">Доступ ограничен</h1>
          <p className="text-[#A0A0A0] mb-6">
            Для доступа к профилю необходимо войти в систему.
          </p>
          <Link
            href="/login?redirect=/profile"
            className="inline-block bg-gold-500 hover:bg-gold-600 text-white py-3 px-6 rounded-lg font-medium"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="bg-[#1E1E1E] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-gold-500">
              Premium Tobacco
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/catalog" className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                Каталог
              </Link>
              <Link href="/cart" className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                Корзина
              </Link>
              <Link href="/profile" className="text-[#F5F5F5] font-medium">
                Профиль
              </Link>
            </nav>
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="md:hidden p-2"
            >
              {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className={`md:w-64 flex-shrink-0 ${showMobileNav ? 'block' : 'hidden md:block'}`}>
            <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#2A2A2A] p-4">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#2A2A2A] mb-4">
                <div className="w-12 h-12 bg-gold-500/15 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <p className="font-medium text-[#F5F5F5]">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-sm text-[#A0A0A0]">{user.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMobileNav(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gold-50 text-gold-700'
                          : 'text-[#A0A0A0] hover:bg-[#121212]'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Выйти
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Health Warning */}
      <footer className="bg-slate-900 text-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-[#666]">
          Минздрав предупреждает: курение вредит Вашему здоровью
        </div>
      </footer>
    </div>
  );
}
