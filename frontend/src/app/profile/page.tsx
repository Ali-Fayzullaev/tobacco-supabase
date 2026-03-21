'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks';
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
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Мой профиль</h1>

      {/* Profile Info Card */}
      <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#2A2A2A] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Личные данные</h2>
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
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1">
                  Имя
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  className="w-full px-4 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-gold-500"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1">
                  Фамилия
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  className="w-full px-4 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-gold-500"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C0C0C0] mb-1">
                Телефон
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-4 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-gold-500"
                placeholder="+7 777 123 45 67"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1">
                  Город
                </label>
                <input
                  {...register('city')}
                  type="text"
                  className="w-full px-4 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-gold-500"
                  placeholder="Алматы"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#C0C0C0] mb-1">
                  Адрес
                </label>
                <input
                  {...register('address')}
                  type="text"
                  className="w-full px-4 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-gold-500"
                  placeholder="ул. Абая, д. 10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 border border-[#333] text-[#C0C0C0] py-2 rounded-lg hover:bg-[#121212]"
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
            <div className="flex items-center gap-3 py-3 border-b border-[#2A2A2A]">
              <User className="w-5 h-5 text-[#666]" />
              <div>
                <p className="text-sm text-[#A0A0A0]">Имя</p>
                <p className="text-[#F5F5F5]">{profile?.first_name} {profile?.last_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-[#2A2A2A]">
              <Mail className="w-5 h-5 text-[#666]" />
              <div>
                <p className="text-sm text-[#A0A0A0]">Email</p>
                <p className="text-[#F5F5F5]">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-[#2A2A2A]">
              <Phone className="w-5 h-5 text-[#666]" />
              <div>
                <p className="text-sm text-[#A0A0A0]">Телефон</p>
                <p className="text-[#F5F5F5]">{profile?.phone || 'Не указан'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-[#2A2A2A]">
              <Calendar className="w-5 h-5 text-[#666]" />
              <div>
                <p className="text-sm text-[#A0A0A0]">Дата рождения</p>
                <p className="text-[#F5F5F5]">
                  {profile?.birth_date ? formatDate(profile.birth_date) : 'Не указана'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3">
              <MapPin className="w-5 h-5 text-[#666]" />
              <div>
                <p className="text-sm text-[#A0A0A0]">Адрес</p>
                <p className="text-[#F5F5F5]">
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
      <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#2A2A2A] p-6">
        <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4">Информация об аккаунте</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
            <span className="text-[#A0A0A0]">Дата регистрации</span>
            <span className="text-[#F5F5F5]">
              {profile?.created_at ? formatDate(profile.created_at) : '-'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#A0A0A0]">Статус</span>
            <span className="text-green-400 font-medium">Подтверждён</span>
          </div>
        </div>
      </div>
    </div>
  );
}
