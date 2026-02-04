'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMaxBirthDate } from '@/lib/utils';

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
  const router = useRouter();
  const { signUp } = useAuth();
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
    const result = await signUp({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      birthDate: data.birthDate,
    });

    setIsSubmitting(false);

    if (result.success) {
      // Проверяем нужно ли подтверждение email
      if (result.needsEmailConfirmation) {
        // Подтверждение включено - переходим на страницу ввода кода
        toast.success('Проверьте вашу почту для подтверждения!');
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        // Подтверждение отключено - сразу вошли
        toast.success('Регистрация успешна! Добро пожаловать!');
        router.push('/catalog');
      }
    } else {
      toast.error(result.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gold-500">
            Tobacco Shop KZ
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Регистрация</h1>
          <p className="text-gray-500 mb-6">Создайте аккаунт для доступа к каталогу</p>

          {/* Age Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">
              Регистрация доступна только для лиц старше 18 лет. 
              Вам нужно будет подтвердить свой возраст.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="Иван"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фамилия
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="Иванов"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                placeholder="example@mail.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон <span className="text-gray-400">(необязательно)</span>
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                placeholder="+7 (777) 123-45-67"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата рождения
              </label>
              <input
                {...register('birthDate')}
                type="date"
                max={getMaxBirthDate()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
              {errors.birthDate && (
                <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">Вам должно быть не менее 18 лет</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="Минимум 8 символов"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Подтвердите пароль
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  {...register('confirmAge')}
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                />
                <span className="text-sm text-gray-600">
                  Подтверждаю, что мне исполнилось <strong>18 лет</strong>
                </span>
              </label>
              {errors.confirmAge && (
                <p className="text-red-500 text-xs">{errors.confirmAge.message}</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  {...register('acceptTerms')}
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                />
                <span className="text-sm text-gray-600">
                  Принимаю{' '}
                  <Link href="/terms" className="text-gold-600 hover:underline">
                    условия использования
                  </Link>{' '}
                  и{' '}
                  <Link href="/privacy" className="text-gold-600 hover:underline">
                    политику конфиденциальности
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-red-500 text-xs">{errors.acceptTerms.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-500 mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-gold-600 hover:underline font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
