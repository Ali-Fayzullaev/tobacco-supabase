'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  Lock,
  Shield,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  KeyRound
} from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const supabase = getSupabaseBrowserClient();

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password strength checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess(false);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 5000);
    }
    setPasswordSaving(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите удалить аккаунт? Это действие необратимо.'
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'Последнее предупреждение: все ваши данные будут удалены безвозвратно. Продолжить?'
    );
    if (!doubleConfirm) return;

    // Sign out and redirect
    await signOut();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Настройки</h1>
        <p className="text-[#A0A0A0] mt-1">Безопасность и параметры аккаунта</p>
      </div>

      {/* Аккаунт */}
      <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6">
        <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#D4AF37]" />
          Аккаунт
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-[#A0A0A0]">Email</span>
            <span className="text-[#F5F5F5] font-medium">{user?.email || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[#2A2A2A]">
            <span className="text-[#A0A0A0]">Дата регистрации</span>
            <span className="text-[#F5F5F5]">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Смена пароля */}
      <form onSubmit={handlePasswordChange} className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6">
        <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#D4AF37]" />
          Смена пароля
        </h2>

        <div className="space-y-4 max-w-md">
          {/* Новый пароль */}
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">
              Новый пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
                placeholder="Минимум 8 символов"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#A0A0A0]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {newPassword && (
              <div className="mt-2 space-y-1">
                <PasswordCheck passed={hasMinLength} label="Минимум 8 символов" />
                <PasswordCheck passed={hasUppercase} label="Заглавная буква" />
                <PasswordCheck passed={hasNumber} label="Цифра" />
              </div>
            )}
          </div>

          {/* Подтверждение */}
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">
              Подтвердите пароль
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#121212] border border-[#2A2A2A] rounded-lg text-[#F5F5F5] placeholder-[#666] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-colors"
              placeholder="Повторите пароль"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-400">Пароли не совпадают</p>
            )}
          </div>

          {passwordError && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Пароль успешно изменён
            </div>
          )}

          <button
            type="submit"
            disabled={!isPasswordValid || passwordSaving}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C4A030] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {passwordSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
            Обновить пароль
          </button>
        </div>
      </form>

      {/* Уведомления */}
      <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6">
        <h2 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#D4AF37]" />
          Уведомления
        </h2>
        <div className="space-y-3">
          <NotificationToggle
            label="Статус заказов"
            description="Уведомления об изменении статуса ваших заказов"
            defaultChecked={true}
          />
          <NotificationToggle
            label="Акции и скидки"
            description="Информация о новых акциях и специальных предложениях"
            defaultChecked={false}
          />
        </div>
      </div>

      {/* Опасная зона */}
      <div className="bg-[#1E1E1E] rounded-xl border border-red-900/30 p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Опасная зона
        </h2>
        <p className="text-[#A0A0A0] text-sm mb-4">
          Удалив аккаунт, вы потеряете все данные. Это действие необратимо.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 font-medium py-2.5 px-5 rounded-lg transition-colors"
        >
          Удалить аккаунт
        </button>
      </div>
    </div>
  );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${passed ? 'text-emerald-400' : 'text-[#666]'}`}>
      <CheckCircle className={`w-3.5 h-3.5 ${passed ? 'text-emerald-400' : 'text-[#444]'}`} />
      {label}
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[#F5F5F5] font-medium">{label}</p>
        <p className="text-xs text-[#666]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#D4AF37]' : 'bg-[#333]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
