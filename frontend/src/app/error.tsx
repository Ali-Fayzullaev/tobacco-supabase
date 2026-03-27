'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку (в production можно отправлять на /api/report-error)
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Иконка */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        {/* Заголовок */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#F5F5F5]">
            Что-то пошло не так
          </h1>
          <p className="text-[#A0A0A0] text-sm leading-relaxed">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу 
            или вернитесь на главную.
          </p>
        </div>

        {/* Digest для поддержки */}
        {error.digest && (
          <p className="text-xs text-[#666] font-mono bg-[#1E1E1E] rounded px-3 py-2">
            Код ошибки: {error.digest}
          </p>
        )}

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 
                       bg-[#D4AF37] text-[#121212] font-semibold rounded-lg
                       hover:bg-[#e8c84a] transition-colors min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            Попробовать снова
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3
                       border border-[#2E2E2E] text-[#F5F5F5] font-medium rounded-lg
                       hover:bg-[#1E1E1E] transition-colors min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            На главную
          </Link>
        </div>

        {/* Предупреждение */}
        <p className="text-xs text-[#666] pt-4 border-t border-[#2E2E2E]">
          Если ошибка повторяется, свяжитесь с нами через WhatsApp
        </p>
      </div>
    </div>
  );
}
