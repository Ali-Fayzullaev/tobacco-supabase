'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, KeyRound, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  // Определяем режим: запрос ссылки или установка нового пароля
  // Supabase перенаправляет с type=recovery и code в URL после клика по ссылке в письме
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showEmailHelp, setShowEmailHelp] = useState(false);

  useEffect(() => {
    // Если в URL есть code + type=recovery — пользователь пришёл по ссылке из письма
    // Supabase auth callback обменяет code на сессию, и onAuthStateChange сработает
    const checkRecovery = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Пользователь уже залогинен через recovery-ссылку
        setMode('reset');
      }
    };
    checkRecovery();

    // Слушаем событие PASSWORD_RECOVERY
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const passwordChecks = {
    length: newPassword.length >= 8,
    upper: /[A-ZА-ЯЁ]/.test(newPassword),
    number: /\d/.test(newPassword),
  };
  const isPasswordStrong = passwordChecks.length && passwordChecks.upper && passwordChecks.number;

  // Запрос ссылки для сброса
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Введите email');
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      }
    );

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'Ошибка отправки');
      return;
    }

    setEmailSent(true);
  };

  // Установка нового пароля
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      toast.error('Пароль не соответствует требованиям');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'Ошибка обновления пароля');
      return;
    }

    setResetSuccess(true);
    toast.success('Пароль успешно обновлён!');
  };

  // Успех — пароль обновлён
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Пароль обновлён!</h2>
              <p className="text-[#A0A0A0] mb-6">Теперь вы можете войти с новым паролем</p>
              <Link href="/catalog">
                <Button className="bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold shadow-lg shadow-gold-500/25 h-11 px-8">
                  Перейти в каталог
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Email отправлен
  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-500/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-gold-500" />
              </div>
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Проверьте почту</h2>
              <p className="text-[#A0A0A0] mb-1">Ссылка для сброса пароля отправлена на</p>
              <p className="text-gold-500 font-medium mb-4">{email}</p>

              <div className="mb-6 p-3 bg-[#121212] rounded-lg border border-[#2A2A2A] text-left">
                <p className="text-[#A0A0A0] text-sm">
                  Нажмите на ссылку в письме для сброса пароля.
                </p>
                <button
                  onClick={() => setShowEmailHelp(!showEmailHelp)}
                  className="mt-2 text-gold-500 hover:text-gold-400 text-xs font-medium transition-colors inline-flex items-center gap-1"
                >
                  {showEmailHelp ? 'Скрыть' : 'Не получили письмо?'}
                  <svg className={`w-3 h-3 transition-transform ${showEmailHelp ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showEmailHelp && (
                  <ul className="mt-3 space-y-2 text-[#888] text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-gold-500 mt-0.5">1.</span>
                      Проверьте папку <strong className="text-[#A0A0A0]">«Спам»</strong> или <strong className="text-[#A0A0A0]">«Промоакции»</strong>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold-500 mt-0.5">2.</span>
                      Убедитесь, что адрес <strong className="text-[#A0A0A0]">{email}</strong> указан верно
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold-500 mt-0.5">3.</span>
                      Письмо может идти до 5 минут — подождите немного
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold-500 mt-0.5">4.</span>
                      Добавьте <strong className="text-[#A0A0A0]">noreply@t.raycon.kz</strong> в контакты для надёжной доставки
                    </li>
                  </ul>
                )}
              </div>

              <Link href="/login">
                <Button variant="outline" className="border-[#2A2A2A] text-[#F5F5F5]">
                  Вернуться ко входу
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[#A0A0A0] hover:text-gold-500 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад ко входу
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

        <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gold-500/10 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-gold-500" />
            </div>
            <CardTitle className="text-2xl text-[#F5F5F5]">
              {mode === 'request' ? 'Забыли пароль?' : 'Новый пароль'}
            </CardTitle>
            <CardDescription className="text-[#A0A0A0]">
              {mode === 'request'
                ? 'Введите email и мы отправим ссылку для сброса'
                : 'Задайте новый пароль для вашего аккаунта'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {mode === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-5">
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

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold shadow-lg shadow-gold-500/25"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-[#C0C0C0] mb-2">Новый пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-11 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-12"
                      placeholder="Минимум 8 символов"
                      autoComplete="new-password"
                      autoFocus
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
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.length ? 'bg-green-500' : 'bg-[#444]'}`} />
                        <span className={passwordChecks.length ? 'text-green-400' : 'text-[#666]'}>Минимум 8 символов</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.upper ? 'bg-green-500' : 'bg-[#444]'}`} />
                        <span className={passwordChecks.upper ? 'text-green-400' : 'text-[#666]'}>Заглавная буква</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.number ? 'bg-green-500' : 'bg-[#444]'}`} />
                        <span className={passwordChecks.number ? 'text-green-400' : 'text-[#666]'}>Цифра</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-sm font-medium text-[#C0C0C0] mb-2">Повторите пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-12 ${
                        confirmPassword && confirmPassword !== newPassword ? 'border-red-500/50' : ''
                      }`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-400 text-xs mt-1">Пароли не совпадают</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !isPasswordStrong || newPassword !== confirmPassword}
                  className="w-full h-12 text-base bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold shadow-lg shadow-gold-500/25 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  {isSubmitting ? 'Сохранение...' : 'Установить новый пароль'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
