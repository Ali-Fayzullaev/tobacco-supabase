'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistered = searchParams.get('registered') === 'true';
  const redirectTo = searchParams.get('redirect') || '/catalog';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isRegistered) {
      toast.success('Регистрация успешна!');
    }
  }, [isRegistered]);

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setIsSubmitting(false);
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Неверный email или пароль';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Email не подтверждён. Проверьте почту.';
      }
      toast.error(errorMessage);
      return;
    }

    toast.success('Добро пожаловать!');
    window.location.href = redirectTo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-white flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
              <span className="text-xl font-bold text-white">T</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">Shop</span>
              <span className="text-2xl font-bold text-orange-500">Shop</span>
            </div>
          </Link>
        </div>

        {/* Form Card */}
        <Card className="bg-white border-gray-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-900">Вход в аккаунт</CardTitle>
            <CardDescription className="text-gray-500">
              Войдите для доступа к каталогу
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Registration Success Message */}
            {isRegistered && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">
                  Аккаунт создан! Проверьте email и подтвердите регистрацию, 
                  затем войдите в систему.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  {...register('email')}
                  type="email"
                  className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-500/20"
                  placeholder="example@mail.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-500/20 pr-10"
                    placeholder="Введите пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...register('rememberMe')}
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 bg-gray-50 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">Запомнить меня</span>
                </label>
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Забыли пароль?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {isSubmitting ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            <Separator className="my-6 bg-gray-200" />

            {/* Register Link */}
            <p className="text-center text-gray-600">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                Зарегистрироваться
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Age Warning */}
        <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span>Доступ к сайту только для лиц старше 18 лет</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
