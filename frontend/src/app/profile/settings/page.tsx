'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Shield, Bell, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(8, 'Минимум 8 символов'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Ошибка при смене пароля');
      }

      toast.success('Пароль успешно изменён');
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при смене пароля');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Note: Account deletion typically requires backend support
    toast.error('Для удаления аккаунта свяжитесь с поддержкой');
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Настройки</h1>

      {/* Security Section */}
      <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#2A2A2A] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-gold-500" />
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Безопасность</h2>
        </div>

        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-[#C0C0C0] mb-1">
              Текущий пароль
            </label>
            <div className="relative">
              <input
                {...register('currentPassword')}
                type={showCurrentPassword ? 'text' : 'password'}
                className="w-full px-4 py-2.5 pr-10 bg-[#121212] border border-[#2A2A2A] rounded-xl text-[#F5F5F5] placeholder:text-[#666] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#C0C0C0] mb-1">
              Новый пароль
            </label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNewPassword ? 'text' : 'password'}
                className="w-full px-4 py-2.5 pr-10 bg-[#121212] border border-[#2A2A2A] rounded-xl text-[#F5F5F5] placeholder:text-[#666] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#C0C0C0] mb-1">
              Подтвердите новый пароль
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full px-4 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-[#F5F5F5] placeholder:text-[#666] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="bg-gold-500 hover:bg-gold-600 text-white py-2 px-6 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
            Изменить пароль
          </button>
        </form>
      </div>

      {/* Notifications Section */}
      <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#2A2A2A] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-gold-500" />
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Уведомления</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between py-2">
            <div>
              <p className="text-[#F5F5F5]">Email уведомления о заказах</p>
              <p className="text-sm text-[#A0A0A0]">Статус и обновления по вашим заказам</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 text-gold-500 rounded focus:ring-gold-500"
            />
          </label>

          <label className="flex items-center justify-between py-2">
            <div>
              <p className="text-[#F5F5F5]">Акции и скидки</p>
              <p className="text-sm text-[#A0A0A0]">Информация о специальных предложениях</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 text-gold-500 rounded focus:ring-gold-500"
            />
          </label>

          <label className="flex items-center justify-between py-2">
            <div>
              <p className="text-[#F5F5F5]">SMS уведомления</p>
              <p className="text-sm text-[#A0A0A0]">Сообщения о статусе доставки</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 text-gold-500 rounded focus:ring-gold-500"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-red-800/30 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-red-400">Опасная зона</h2>
        </div>

        <p className="text-[#A0A0A0] mb-4">
          Удаление аккаунта необратимо. Все ваши данные, история заказов и избранное будут удалены.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="border border-red-300 text-red-400 hover:bg-red-900/20 py-2 px-6 rounded-lg"
          >
            Удалить аккаунт
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAccount}
              className="bg-red-900/200 hover:bg-red-600 text-white py-2 px-6 rounded-lg"
            >
              Подтвердить удаление
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="border border-[#333] text-[#C0C0C0] py-2 px-6 rounded-lg"
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
