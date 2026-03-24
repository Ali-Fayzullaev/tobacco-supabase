'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ArrowLeft, UserPlus, Mail, Lock, Eye, EyeOff, User, CheckCircle2, ShieldCheck, Building2, Hash } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('redirect') || '/catalog';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [binIin, setBinIin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // OTP verification
  const [step, setStep] = useState<'form' | 'verify' | 'success'>('form');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-ZА-ЯЁ]/.test(password),
    number: /\d/.test(password),
  };
  const isPasswordStrong = passwordChecks.length && passwordChecks.upper && passwordChecks.number;

  // Step 1: Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { toast.error('Введите имя и фамилию'); return; }
    if (!organizationName.trim()) { toast.error('Укажите название организации (ТОО/ИП)'); return; }
    if (!binIin.trim() || !/^\d{12}$/.test(binIin.trim())) { toast.error('БИН/ИИН должен содержать ровно 12 цифр'); return; }
    if (!email.trim()) { toast.error('Введите email'); return; }
    if (!isPasswordStrong) { toast.error('Пароль не соответствует требованиям'); return; }
    if (password !== confirmPassword) { toast.error('Пароли не совпадают'); return; }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          organization_name: organizationName.trim(),
          bin_iin: binIin.trim(),
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        toast.error('Этот email уже зарегистрирован. Попробуйте войти.');
      } else {
        toast.error(error.message || 'Ошибка регистрации');
      }
      return;
    }

    // Supabase возвращает фейковый успех для существующих email (защита от перебора).
    // Если identities пустой — значит email уже занят.
    if (data?.user?.identities?.length === 0) {
      toast.error('Этот email уже зарегистрирован. Попробуйте войти.');
      return;
    }

    setStep('verify');
    setResendCooldown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted.length) return;
    const newOtp = [...otpCode];
    for (let i = 0; i < pasted.length && i < 6; i++) newOtp[i] = pasted[i];
    setOtpCode(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) { toast.error('Введите 6-значный код'); return; }

    setIsVerifying(true);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: 'signup',
    });

    setIsVerifying(false);

    if (error) {
      toast.error('Неверный код. Проверьте и попробуйте снова.');
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      return;
    }

    setStep('success');
    toast.success('Email подтверждён!');
    setTimeout(() => router.push(redirectTo), 2000);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
    if (error) {
      toast.error('Не удалось отправить код. Попробуйте позже.');
    } else {
      toast.success('Код отправлен повторно');
      setResendCooldown(60);
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  // Шаг 3: Успешная верификация
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Добро пожаловать!</h2>
              <p className="text-[#A0A0A0] mb-4">Ваш аккаунт успешно создан и подтверждён.</p>
              <p className="text-[#666] text-sm mb-6">Перенаправляем в каталог...</p>
              <Loader2 className="w-5 h-5 text-gold-500 animate-spin mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Шаг 2: Ввод кода подтверждения
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <Card className="bg-[#1E1E1E] border-[#2A2A2A] shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gold-500/10 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-gold-500" />
              </div>
              <CardTitle className="text-2xl text-[#F5F5F5]">Подтверждение email</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Мы отправили 6-значный код на
              </CardDescription>
              <p className="text-gold-500 font-medium mt-1">{email}</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-[#121212] border-2 border-[#2A2A2A] rounded-lg text-[#F5F5F5] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-colors"
                  />
                ))}
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpCode.join('').length !== 6}
                className="w-full h-12 text-base bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold shadow-lg shadow-gold-500/25 disabled:opacity-50 mb-4"
              >
                {isVerifying && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {isVerifying ? 'Проверка...' : 'Подтвердить'}
              </Button>

              <div className="text-center">
                <p className="text-[#666] text-sm mb-2">Не получили код?</p>
                {resendCooldown > 0 ? (
                  <p className="text-[#A0A0A0] text-sm">
                    Отправить повторно через <span className="text-gold-500 font-medium">{resendCooldown}с</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendCode}
                    className="text-gold-500 hover:text-gold-400 text-sm font-medium transition-colors"
                  >
                    Отправить код повторно
                  </button>
                )}
              </div>

              <div className="mt-6 p-3 bg-[#121212] rounded-lg border border-[#2A2A2A]">
                <p className="text-[#666] text-xs text-center">
                  Проверьте папку «Спам», если письмо не приходит. Код действителен 60 минут.
                </p>
              </div>
            </CardContent>
          </Card>

          <button
            onClick={() => { setStep('form'); setOtpCode(['', '', '', '', '', '']); }}
            className="flex items-center gap-2 mx-auto mt-6 text-[#A0A0A0] hover:text-gold-500 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Изменить данные
          </button>
        </div>
      </div>
    );
  }

  // Шаг 1: Форма регистрации
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[#A0A0A0] hover:text-gold-500 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

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
              <UserPlus className="w-7 h-7 text-gold-500" />
            </div>
            <CardTitle className="text-2xl text-[#F5F5F5]">Регистрация</CardTitle>
            <CardDescription className="text-[#A0A0A0]">Создайте аккаунт для оформления заказов</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#C0C0C0] mb-1.5">Имя</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-11" placeholder="Иван" autoComplete="given-name" autoFocus />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#C0C0C0] mb-1.5">Фамилия</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-11" placeholder="Иванов" autoComplete="family-name" />
                </div>
              </div>

              {/* B2B поля */}
              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1.5">
                  Название организации <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="pl-10 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-11" placeholder="ТОО, ИП..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1.5">
                  БИН / ИИН <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input value={binIin} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 12); setBinIin(v); }} className="pl-10 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-11" placeholder="12 цифр" maxLength={12} inputMode="numeric" />
                </div>
                {binIin && binIin.length !== 12 && (
                  <p className="text-[#666] text-xs mt-1">{binIin.length}/12 цифр</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-11" placeholder="your@email.com" autoComplete="email" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1.5">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-11 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-11" placeholder="Минимум 8 символов" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#A0A0A0] transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
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

              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1.5">Повторите пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`pl-10 bg-[#121212] border-[#2A2A2A] focus:border-gold-500/40 focus:ring-gold-500/20 h-11 ${confirmPassword && confirmPassword !== password ? 'border-red-500/50' : ''}`} placeholder="••••••••" autoComplete="new-password" />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-red-400 text-xs mt-1">Пароли не совпадают</p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting || !isPasswordStrong || password !== confirmPassword} className="w-full h-12 text-base bg-gold-500 hover:bg-gold-600 text-[#121212] font-semibold shadow-lg shadow-gold-500/25 disabled:opacity-50">
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {isSubmitting ? 'Регистрация...' : 'Создать аккаунт'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A2A2A]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1E1E1E] px-3 text-[#666]">или</span>
              </div>
            </div>

            <p className="text-center text-[#A0A0A0] text-sm">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-gold-500 hover:text-gold-400 font-medium transition-colors">Войти</Link>
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 mt-6 text-[#A0A0A0] text-sm">
          <AlertTriangle className="h-4 w-4 text-gold-500" />
          <span>Доступ только для лиц старше 21 года</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  );
}
