'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, ArrowRight, Clock, Trash2, ShoppingCart, Loader2, TrendingUp } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { formatPrice, cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  in_stock: boolean;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 8;

function getHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToHistory(query: string) {
  const history = getHistory().filter(h => h !== query);
  history.unshift(query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseBrowserClient();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Фокус на input при открытии
  useEffect(() => {
    if (isOpen) {
      setHistory(getHistory());
      setQuery('');
      setResults([]);
      setTotalCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Живой поиск с debounce
  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, count } = await supabase
        .from('products')
        .select('id, slug, name, brand, price, old_price, image_url, in_stock', { count: 'exact' })
        .eq('is_active', true)
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
        .order('in_stock', { ascending: false })
        .order('is_featured', { ascending: false })
        .limit(6);

      setResults(data || []);
      setTotalCount(count || 0);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      setIsLoading(true);
      debounceRef.current = setTimeout(() => searchProducts(value), 300);
    } else {
      setResults([]);
      setTotalCount(0);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory(query.trim());
      onClose();
      router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleHistoryClick = (q: string) => {
    setQuery(q);
    searchProducts(q);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleResultClick = (slug: string) => {
    if (query.trim()) saveToHistory(query.trim());
    onClose();
  };

  const handleShowAll = () => {
    if (query.trim()) {
      saveToHistory(query.trim());
      onClose();
      router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) return null;

  const hasQuery = query.trim().length >= 2;
  const showHistory = !hasQuery && history.length > 0;
  const showResults = hasQuery && results.length > 0;
  const showEmpty = hasQuery && !isLoading && results.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative flex flex-col bg-[#121212] max-h-[85vh] lg:max-h-[70vh] lg:max-w-2xl lg:mx-auto lg:mt-20 lg:rounded-2xl lg:border lg:border-[#2A2A2A] lg:shadow-2xl overflow-hidden">
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-b border-[#2A2A2A] bg-[#1A1A1A]">
          <Search className="w-5 h-5 text-[#666] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Название, бренд..."
            className="flex-1 bg-transparent text-[#F5F5F5] text-base placeholder:text-[#666] outline-none"
            autoComplete="off"
            autoCapitalize="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setTotalCount(0); inputRef.current?.focus(); }}
              className="p-1.5 rounded-full hover:bg-[#2A2A2A] text-[#666] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[#A0A0A0] hover:text-[#F5F5F5] font-medium px-2 transition-colors"
          >
            Отмена
          </button>
        </form>

        {/* Scrollable results */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
          {isLoading && hasQuery && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
            </div>
          )}

          {/* Search History */}
          {showHistory && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#666] uppercase tracking-wide">Недавние</span>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-[#666] hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Очистить
                </button>
              </div>
              <div className="space-y-0.5">
                {history.map((h, i) => (
                  <button
                    key={`${h}-${i}`}
                    onClick={() => handleHistoryClick(h)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#1E1E1E] transition-colors group min-h-[44px]"
                  >
                    <Clock className="w-4 h-4 text-[#555] flex-shrink-0" />
                    <span className="text-sm text-[#C0C0C0] group-hover:text-[#F5F5F5] text-left truncate">{h}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#555] ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Suggestions when no history */}
          {!hasQuery && history.length === 0 && (
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#666]" />
                <span className="text-xs font-medium text-[#666] uppercase tracking-wide">Попробуйте</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['IQOS', 'Parliament', 'Kent', 'Winston', 'Heets'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleHistoryClick(tag)}
                    className="px-3 py-1.5 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] text-sm text-[#A0A0A0] hover:border-gold-500/40 hover:text-gold-500 transition-colors min-h-[36px]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && !isLoading && (
            <div className="p-2">
              {results.map((product) => {
                const discount = product.old_price
                  ? Math.round((1 - product.price / product.old_price) * 100)
                  : 0;
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={() => handleResultClick(product.slug)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1E1E1E] transition-colors min-h-[44px]"
                  >
                    {/* Image */}
                    <div className="relative w-12 h-12 bg-[#1E1E1E] rounded-lg overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-[#555]" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#F5F5F5] line-clamp-1">{product.name}</p>
                      {product.brand && (
                        <p className="text-xs text-[#666] mt-0.5">{product.brand}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gold-500">{formatPrice(product.price)}</p>
                      {discount > 0 && product.old_price && (
                        <p className="text-[10px] text-[#666] line-through">{formatPrice(product.old_price)}</p>
                      )}
                      {!product.in_stock && (
                        <p className="text-[10px] text-red-400">Нет в наличии</p>
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Show All Results */}
              {totalCount > results.length && (
                <button
                  onClick={handleShowAll}
                  className="w-full mt-1 px-3 py-3 rounded-xl bg-[#1E1E1E] hover:bg-[#252525] transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span className="text-sm font-medium text-gold-500">
                    Показать все {totalCount} результатов
                  </span>
                  <ArrowRight className="w-4 h-4 text-gold-500" />
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="py-12 text-center">
              <Search className="w-10 h-10 text-[#333] mx-auto mb-3" />
              <p className="text-sm text-[#666]">Ничего не найдено по запросу</p>
              <p className="text-sm text-[#F5F5F5] font-medium mt-1">«{query}»</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
