'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const supabase = getSupabaseBrowserClient();
  
  // 6-значный код
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // Таймер для кнопки повторной отправки
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Фокус на первое поле при загрузке
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Обработка ввода цифры
  const handleInput = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  // Обработка вставки кода
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length > 0) {
      const newCode = [...code];
      pastedData.split('').forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);
      
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  // Обработка backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Проверка кода
  const handleVerify = async (codeString?: string) => {
    const fullCode = codeString || code.join('');
    
    if (!email) {
      setError('Email не указан');
      return;
    }

    if (fullCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setIsVerifying(true);
    setError('');

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: fullCode,
      type: 'signup',
    });

    setIsVerifying(false);

    if (error) {
      setError(error.message || 'Неверный код');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      toast.success('Email подтверждён! Добро пожаловать!');
      window.location.href = '/catalog';
    }
  };

  // Повторная отправка кода
  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    
    if (error) {
      toast.error(error.message || 'Не удалось отправить код');
    } else {
      toast.success('Новый код отправлен!');
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gold-500">
            Premium Tobacco
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#1E1E1E] rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gold-500/15 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-gold-600" />
          </div>

          <h1 className="text-2xl font-bold text-[#F5F5F5] mb-2">
            Введите код подтверждения
          </h1>
          
          <p className="text-[#A0A0A0] mb-2">
            Мы отправили 6-значный код на:
          </p>

          {email && (
            <div className="bg-[#252525] rounded-lg px-4 py-2 mb-6 inline-block">
              <span className="font-medium text-[#F5F5F5]">{email}</span>
            </div>
          )}

          {/* Code Input - 6 полей */}
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isVerifying}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-colors
                  ${error ? 'border-red-300 bg-red-900/20' : 'border-[#333]'}
                  ${digit ? 'border-amber-500 bg-amber-50' : ''}
                  focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 mb-4">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={isVerifying || code.join('').length !== 6}
            className="w-full py-3 bg-amber-500 text-white rounded-lg font-medium
              hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors mb-4"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Проверяем...
              </span>
            ) : (
              'Подтвердить'
            )}
          </button>

          {/* Tips */}
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-[#A0A0A0] text-sm">
                Код действителен 1 час
              </span>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-[#A0A0A0] text-sm">
                Проверьте папку «Спам», если письмо не пришло
              </span>
            </div>
          </div>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || !email}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 
              border border-[#333] rounded-lg text-[#C0C0C0] 
              hover:bg-[#121212] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            {resendCooldown > 0 
              ? `Отправить код повторно (${resendCooldown}с)` 
              : 'Отправить код повторно'
            }
          </button>

          {/* Back to register */}
          <div className="mt-8 pt-6 border-t border-[#2A2A2A]">
            <p className="text-[#A0A0A0] text-sm">
              Ошиблись с email?{' '}
              <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium">
                Зарегистрироваться заново
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}