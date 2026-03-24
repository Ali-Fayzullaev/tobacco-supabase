'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  Save,
  CheckCircle,
  Loader2,
  Calendar
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, updateProfile, refreshProfile, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    city: '',
    address: '',
    organization_name: '',
    bin_iin: '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        birth_date: profile.birth_date || '',
        city: profile.city || '',
        address: profile.address || '',
        organization_name: profile.organization_name || '',
        bin_iin: profile.bin_iin || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    if (!formData.organization_name?.trim()) {
      setError('Укажите название организации');
      setSaving(false);
      return;
    }
    if (!formData.bin_iin?.trim() || !/^\d{12}$/.test(formData.bin_iin.trim())) {
      setError('БИН/ИИН должен содержать ровно 12 цифр');
      setSaving(false);
      return;
    }

    const result = await updateProfile({
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      phone: formData.phone || null,
      birth_date: formData.birth_date || null,
      city: formData.city || null,
      address: formData.address || null,
      organization_name: formData.organization_name.trim(),
      bin_iin: formData.bin_iin.trim(),
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Ошибка сохранения');
    }
    setSaving(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Мой профиль</h1>
        <p className="text-[#A0A0A0] mt-1">Управление личными данными</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Основная информация */}
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#D4AF37]" />
            Основная информация
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">Имя</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
                placeholder="Ваше имя"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">Фамилия</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
                placeholder="Ваша фамилия"
              />
            </div>
          </div>

          {/* Email (только чтение) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <div className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#666] cursor-not-allowed">
              {user?.email || '—'}
            </div>
            <p className="text-xs text-[#666] mt-1">Email нельзя изменить</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">
                <Phone className="w-4 h-4 inline mr-1" />
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
                placeholder="+7 (7XX) XXX-XX-XX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата рождения
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Адрес доставки */}
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#D4AF37]" />
            Адрес доставки
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">Город</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
                placeholder="Например: Алматы"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">Адрес</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
                placeholder="Улица, дом, квартира"
              />
            </div>
          </div>
        </div>

        {/* Организация (опционально) */}
        <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            Организация
            <span className="text-xs text-red-400 font-normal">*</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">Название организации</label>
              <input
                type="text"
                value={formData.organization_name}
                onChange={(e) => handleChange('organization_name', e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
                placeholder="ТОО, ИП..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">БИН / ИИН</label>
              <input
                type="text"
                value={formData.bin_iin}
                onChange={(e) => handleChange('bin_iin', e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
                placeholder="12 цифр"
                maxLength={12}
              />
            </div>
          </div>
        </div>

        {/* Кнопка сохранения */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Профиль успешно обновлён
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C4A030] disabled:opacity-50 text-white font-medium py-3 px-8 rounded-lg transition-colors"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Сохранить изменения
        </button>
      </form>
    </div>
  );
}
