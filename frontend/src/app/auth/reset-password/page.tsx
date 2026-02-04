'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const resetSchema = z.object({
  email: z.string().email('Введите корректный email'),
});

type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const { resetPassword, isLoading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    const result = await resetPassword(data.email);

    if (result.success) {
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success('Инструкции отправлены на email');
    } else {
      toast.error(result.error || 'Ошибка при отправке');
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
          {!isSubmitted ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Восстановление пароля
              </h1>
              <p className="text-gray-500 mb-6">
                Введите email, указанный при регистрации. Мы отправим ссылку для сброса пароля.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isLoading ? 'Отправка...' : 'Отправить ссылку'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-gold-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Проверьте почту
              </h1>
              <p className="text-gray-500 mb-6">
                Мы отправили инструкции по восстановлению пароля на{' '}
                <span className="font-medium text-gray-700">{submittedEmail}</span>
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Если письмо не пришло, проверьте папку «Спам»
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-gold-600 hover:underline font-medium"
              >
                Отправить повторно
              </button>
            </div>
          )}

          {/* Back to Login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 mt-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
