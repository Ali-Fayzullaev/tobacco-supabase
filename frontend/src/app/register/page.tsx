'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { getMaxBirthDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const registerSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Введите имя'),
  lastName: z.string().min(2, 'Введите фамилию'),
  phone: z.string().optional(),
  birthDate: z.string().min(1, 'Укажите дату рождения'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Необходимо принять условия использования',
  }),
  confirmAge: z.boolean().refine(val => val === true, {
    message: 'Необходимо подтвердить возраст',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    
    const supabase = getSupabaseBrowserClient();
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          birth_date: data.birthDate,
        },
      },
    });

    if (error) {
      setIsSubmitting(false);
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = 'Этот email уже зарегистрирован. Попробуйте войти.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Слишком много попыток. Подождите час.';
      }
      toast.error(errorMessage);
      return;
    }

    if (authData.session) {
      toast.success('Регистрация успешна!');
      window.location.href = '/catalog';
    } else {
      toast.success('Проверьте вашу почту для подтверждения!');
      window.location.href = `/verify-email?email=${encodeURIComponent(data.email)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-white flex items-center justify-center p-4 py-12">
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
              <span className="text-2xl font-bold text-gray-900">Tobacco</span>
              <span className="text-2xl font-bold text-orange-500">Shop</span>
            </div>
          </Link>
        </div>

        {/* Form Card */}
        <Card className="bg-white border-gray-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-900">Регистрация</CardTitle>
            <CardDescription className="text-gray-500">
              Создайте аккаунт для доступа к каталогу
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Age Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">18+</p>
                <p className="text-red-600 text-xs">
                  Регистрация доступна только для лиц, достигших 18-летнего возраста
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя *
                  </label>
                  <Input
                    {...register('firstName')}
                    className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-500/20"
                    placeholder="Иван"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фамилия *
                  </label>
                  <Input
                    {...register('lastName')}
                    className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-500/20"
                    placeholder="Иванов"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
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

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <Input
                  {...register('phone')}
                  type="tel"
                  className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-500/20"
                  placeholder="+7 (777) 123-45-67"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата рождения *
                </label>
                <Input
                  {...register('birthDate')}
                  type="date"
                  max={getMaxBirthDate()}
                  className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-500/20"
                />
                {errors.birthDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль *
                </label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-500/20 pr-10"
                    placeholder="Минимум 8 символов"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтверждение пароля *
                </label>
                <div className="relative">
                  <Input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-500/20 pr-10"
                    placeholder="Повторите пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Separator className="my-4 bg-gray-200" />

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    {...register('confirmAge')}
                    type="checkbox"
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 bg-gray-50 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">
                    Подтверждаю, что мне исполнилось 18 лет
                  </span>
                </label>
                {errors.confirmAge && (
                  <p className="text-red-500 text-xs ml-8">{errors.confirmAge.message}</p>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    {...register('acceptTerms')}
                    type="checkbox"
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 bg-gray-50 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">
                    Принимаю{' '}
                    <Link href="/terms" className="text-orange-500 hover:underline">
                      условия использования
                    </Link>{' '}
                    и{' '}
                    <Link href="/privacy" className="text-orange-500 hover:underline">
                      политику конфиденциальности
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-red-500 text-xs ml-8">{errors.acceptTerms.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base mt-6 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>

            <Separator className="my-6 bg-gray-200" />

            {/* Login Link */}
            <p className="text-center text-gray-600">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                Войти
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
