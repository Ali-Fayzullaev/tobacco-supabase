import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 */}
        <div className="space-y-1">
          <h1 className="text-8xl font-bold text-[#D4AF37] tracking-tighter">
            404
          </h1>
          <div className="mx-auto w-16 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-full" />
        </div>

        {/* Описание */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5F5F5]">
            Страница не найдена
          </h2>
          <p className="text-[#A0A0A0] text-sm leading-relaxed">
            Запрашиваемая страница не существует, была удалена 
            или временно недоступна.
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 
                       bg-[#D4AF37] text-[#121212] font-semibold rounded-lg
                       hover:bg-[#e8c84a] transition-colors min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            Перейти в каталог
          </Link>

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

        {/* Предупреждение (всегда на табачных сайтах) */}
        <p className="text-xs text-[#666] pt-4 border-t border-[#2E2E2E]">
          Premium Tobacco — только для лиц старше 21 года
        </p>
      </div>
    </div>
  );
}
