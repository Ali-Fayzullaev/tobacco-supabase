'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Введите имя'),
  lastName: z.string().min(2, 'Введите фамилию'),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, profile, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      address: profile?.address || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    const result = await updateProfile({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      city: data.city,
      address: data.address,
    });

    if (result.success) {
      toast.success('Профиль обновлён');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Ошибка при обновлении');
    }
  };

  const handleCancel = () => {
    reset({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      address: profile?.address || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Мой профиль</h1>

      {/* Profile Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Личные данные</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gold-600 hover:underline text-sm font-medium"
            >
              Редактировать
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                placeholder="+7 777 123 45 67"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Город
                </label>
                <input
                  {...register('city')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                  placeholder="Алматы"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес
                </label>
                <input
                  {...register('address')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                  placeholder="ул. Абая, д. 10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gold-500 hover:bg-gold-600 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Сохранить
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Имя</p>
                <p className="text-gray-900">{profile?.first_name} {profile?.last_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Телефон</p>
                <p className="text-gray-900">{profile?.phone || 'Не указан'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Дата рождения</p>
                <p className="text-gray-900">
                  {profile?.birth_date ? formatDate(profile.birth_date) : 'Не указана'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Адрес</p>
                <p className="text-gray-900">
                  {profile?.city || profile?.address 
                    ? `${profile?.city || ''}${profile?.city && profile?.address ? ', ' : ''}${profile?.address || ''}`
                    : 'Не указан'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Информация об аккаунте</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Дата регистрации</span>
            <span className="text-gray-900">
              {profile?.created_at ? formatDate(profile.created_at) : '-'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Статус</span>
            <span className="text-green-600 font-medium">Подтверждён</span>
          </div>
        </div>
      </div>
    </div>
  );
}
