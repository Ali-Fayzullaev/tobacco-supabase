'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/catalog';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const check = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = redirectTo;
        return;
      }
      setIsCheckingAuth(false);
    };
    check();
  }, [redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Введите email');
      return;
    }
    if (!password) {
      toast.error('Введите пароль');
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      if (error.message === 'Invalid login credentials') {
        toast.error('Неверный email или пароль');
      } else if (error.message === 'Email not confirmed') {
        toast.error('Подтвердите email — проверьте почту');
      } else {
        toast.error(error.message || 'Ошибка входа');
      }
      return;
    }

    toast.success('Добро пожаловать!');
    window.location.href = redirectTo;
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#A0A0A0] hover:text-gold-500 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-lg shadow-gold-500/25">
              <span className="text-xl font-bold text-white">T</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-[#F5F5F5]">Premium</span>
              <span className="text-2xl font-bold text-gold-500"> Tobacco</span>
            </div>
          </Link>
        </div>

        {/* Form Card */}
        <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gold-500/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-gold-500" />
            </div>
            <CardTitle className="text-2xl text-[#F5F5F5]">Вход в систему</CardTitle>
            <CardDescription className="text-[#A0A0A0]">
              Введите ваш email и пароль
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-12"
                    placeholder="your@email.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#C0C0C0]">Пароль</label>
                  <Link
                    href="/auth/reset-password"
                    className="text-sm text-gold-500 hover:text-gold-400 transition-colors"
                  >
                    Забыли пароль?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-11 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#A0A0A0] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold shadow-lg shadow-gold-500/25"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {isSubmitting ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A2A2A]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1E1E1E] px-3 text-[#666]">или</span>
              </div>
            </div>

            {/* Register */}
            <p className="text-center text-[#A0A0A0] text-sm">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-gold-500 hover:text-gold-400 font-medium transition-colors">
                Зарегистрироваться
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Age warning */}
        <div className="flex items-center justify-center gap-2 mt-6 text-[#A0A0A0] text-sm">
          <AlertTriangle className="h-4 w-4 text-gold-500" />
          <span>Доступ только для лиц старше 21 года</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
