'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  SlidersHorizontal, 
  Grid2X2,
  LayoutList, 
  ShoppingCart,
  X,
  Loader2,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ArrowLeft,
  Layers,
  Tag
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard, ProductCardCompact } from '@/components/ProductCard';
import { ProductCardSkeleton, ProductCardCompactSkeleton, Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';
type GridSize = '2' | '3' | '4' | '5' | '6';
type CardSize = 'compact' | 'normal' | 'comfortable';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Сначала дешевые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
  { value: 'popular', label: 'По популярности' },
];

const gridOptions: { value: GridSize; label: string; cols: number }[] = [
  { value: '2', label: '2', cols: 2 },
  { value: '3', label: '3', cols: 3 },
  { value: '4', label: '4', cols: 4 },
  { value: '5', label: '5', cols: 5 },
  { value: '6', label: '6', cols: 6 },
];

const cardSizeOptions: { value: CardSize; label: string }[] = [
  { value: 'compact', label: 'Компактные' },
  { value: 'normal', label: 'Стандартные' },
  { value: 'comfortable', label: 'Просторные' },
];

function getGridClass(gridSize: GridSize): string {
  switch (gridSize) {
    case '2': return 'grid-cols-1 sm:grid-cols-2';
    case '3': return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3';
    case '4': return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    case '5': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
    case '6': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
    default: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  }
}

function getGapClass(cardSize: CardSize): string {
  switch (cardSize) {
    case 'compact': return 'gap-2 sm:gap-3';
    case 'normal': return 'gap-3 sm:gap-4';
    case 'comfortable': return 'gap-4 sm:gap-5';
    default: return 'gap-4';
  }
}

// Градиенты для категорий без изображений
const categoryGradients: Record<string, string> = {
  'cigarettes': 'from-amber-700 via-amber-800 to-amber-950',
  'papirosy': 'from-stone-600 via-stone-700 to-stone-900',
  'cigarillos': 'from-gold-700 via-gold-800 to-gold-950',
  'cigars': 'from-yellow-800 via-amber-900 to-amber-950',
  'tobacco': 'from-lime-800 via-green-900 to-green-950',
  'smoking-tobacco': 'from-emerald-700 via-emerald-800 to-emerald-950',
  'hookah-tobacco': 'from-purple-700 via-purple-800 to-purple-950',
  'pipe-tobacco': 'from-rose-700 via-rose-800 to-rose-950',
  'e-cigarettes': 'from-cyan-700 via-cyan-800 to-cyan-950',
  'accessories': 'from-slate-600 via-slate-700 to-slate-900',
};

const categoryEmojis: Record<string, string> = {
  'cigarettes': '🚬',
  'papirosy': '🚬',
  'cigarillos': '🚬',
  'cigars': '🚬',
  'tobacco': '🍂',
  'smoking-tobacco': '🍂',
  'hookah-tobacco': '💨',
  'pipe-tobacco': '🪈',
  'e-cigarettes': '💨',
  'accessories': '🔥',
};

/* ─────────────────────────────────────────────
   Карточка категории
   ───────────────────────────────────────────── */
function CategoryCard({ 
  category, 
  subcategoryCount = 0,
  onClick,
  className,
}: { 
  category: Category; 
  subcategoryCount?: number;
  onClick: () => void;
  className?: string;
}) {
  const gradient = categoryGradients[category.slug] || 'from-gray-700 via-gray-800 to-gray-900';
  const emoji = categoryEmojis[category.slug] || '📦';

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500",
        "hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2",
        className
      )}
    >
      {category.image_url ? (
        <img 
          src={category.image_url} 
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
          <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity duration-500">
            <span className="text-8xl select-none">{emoji}</span>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E1E1E]/10 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#1E1E1E]/5 rounded-full translate-y-1/2 -translate-x-1/2 opacity-30" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-black/30 transition-all duration-500" />
      
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
        <h3 className="text-white font-bold text-lg sm:text-xl tracking-tight drop-shadow-lg text-left">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-white/60 text-sm mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 text-left">
            {category.description}
          </p>
        )}
        {subcategoryCount > 0 && (
          <p className="text-gold-300/80 text-xs mt-2 flex items-center gap-1.5 text-left">
            <Layers className="w-3.5 h-3.5" />
            {subcategoryCount} подкатегори{subcategoryCount > 4 ? 'й' : subcategoryCount > 1 ? 'и' : 'я'}
          </p>
        )}
      </div>

      <div className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-gold-500/90 transition-all duration-500 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
        <ChevronRight className="w-4 h-4 text-white" />
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Шоукейс категорий (главный экран каталога)
   ───────────────────────────────────────────── */
function CategoriesShowcase({ 
  parentCategories,
  getSubcategories,
  onSelectCategory 
}: { 
  parentCategories: Category[];
  getSubcategories: (parentId: string) => Category[];
  onSelectCategory: (categoryId: string) => void;
}) {
  if (parentCategories.length === 0) return null;

  const firstRow = parentCategories.slice(0, 4);
  const secondRow = parentCategories.slice(4, 6);
  const thirdRow = parentCategories.slice(6);

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight">
          Каталог товаров
        </h2>
        <p className="text-[#A0A0A0] mt-2 text-lg">
          Выберите интересующую категорию
        </p>
      </div>

      {/* Ряд 1 — 4 карточки */}
      {firstRow.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {firstRow.map((cat) => (
            <CategoryCard 
              key={cat.id}
              category={cat}
              subcategoryCount={getSubcategories(cat.id).length}
              onClick={() => onSelectCategory(cat.id)}
              className="aspect-[4/3] sm:aspect-square"
            />
          ))}
        </div>
      )}

      {/* Ряд 2 — 2 широкие карточки с подкатегориями */}
      {secondRow.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {secondRow.map((cat) => {
            const subs = getSubcategories(cat.id);
            const gradient = categoryGradients[cat.slug] || 'from-gray-700 via-gray-800 to-gray-900';
            const emoji = categoryEmojis[cat.slug] || '📦';
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative w-full overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1.5 aspect-[2.2/1] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {cat.image_url ? (
                  <img 
                    src={cat.image_url} 
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-15">
                      <span className="text-9xl select-none">{emoji}</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent group-hover:from-black/90 transition-all duration-500" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
                  <h3 className="text-white font-bold text-xl sm:text-2xl tracking-tight drop-shadow-lg">
                    {cat.name}
                  </h3>
                  {subs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {subs.map(sub => (
                        <span 
                          key={sub.id}
                          onClick={(e) => { e.stopPropagation(); onSelectCategory(sub.id); }}
                          className="px-3 py-1.5 bg-[#1E1E1E]/15 backdrop-blur-sm text-white/90 text-sm rounded-full hover:bg-gold-500/80 transition-all duration-300 cursor-pointer hover:scale-105"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-gold-500/90 transition-all duration-500">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Ряд 3 — остальные */}
      {thirdRow.length > 0 && (
        <div className={cn(
          "grid gap-3 sm:gap-4",
          thirdRow.length === 1 ? "grid-cols-1 max-w-sm" :
          thirdRow.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
          "grid-cols-2 sm:grid-cols-3"
        )}>
          {thirdRow.map((cat) => (
            <CategoryCard 
              key={cat.id}
              category={cat}
              subcategoryCount={getSubcategories(cat.id).length}
              onClick={() => onSelectCategory(cat.id)}
              className="aspect-[4/3]"
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────
   Баннер выбранной категории
   ───────────────────────────────────────────── */
function ActiveCategoryBanner({ 
  category, 
  parentCategory,
  subcategories,
  onBack, 
  onSelectSub 
}: { 
  category: Category; 
  parentCategory: Category | null;
  subcategories: Category[];
  onBack: () => void; 
  onSelectSub: (id: string) => void;
}) {
  const gradient = categoryGradients[category.slug] || 'from-gray-700 via-gray-800 to-gray-900';

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-2xl">
        {category.image_url ? (
          <img 
            src={category.image_url} 
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-r", gradient)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        
        <div className="relative p-6 sm:p-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-3 transition-colors group/back"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
            {parentCategory ? parentCategory.name : 'Все категории'}
          </button>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {category.name}
          </h2>
          {category.description && (
            <p className="text-white/60 mt-2 max-w-xl">{category.description}</p>
          )}
          
          {subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {subcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => onSelectSub(sub.id)}
                  className="px-4 py-2 bg-[#1E1E1E]/15 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-gold-500/80 transition-all duration-300 hover:scale-105"
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Главный контент каталога
   ───────────────────────────────────────────── */
function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { searchProducts, products, isLoading: isProductsLoading } = useProducts();
  const { categories, parentCategories, getSubcategories, getCategoryById, isLoading: isCategoriesLoading } = useCategories();

  // Можно ли показывать цены/корзину: авторизован + 18+
  const isAdult = profile?.birth_date && 
    new Date(profile.birth_date) <= new Date(new Date().setFullYear(new Date().getFullYear() - 18));
  const canBuy = !!user && !!isAdult;
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridSize, setGridSize] = useState<GridSize>('4');
  const [cardSize, setCardSize] = useState<CardSize>('normal');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest'
  );
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });

  // Шоукейс — когда нет выбранной категории и нет поиска
  const isShowcaseMode = !selectedCategory && !searchQuery;

  // Настройки из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGridSize = localStorage.getItem('catalog_grid_size') as GridSize;
      const savedCardSize = localStorage.getItem('catalog_card_size') as CardSize;
      const savedViewMode = localStorage.getItem('catalog_view_mode') as 'grid' | 'list';
      if (savedGridSize && ['2', '3', '4', '5', '6'].includes(savedGridSize)) setGridSize(savedGridSize);
      if (savedCardSize && ['compact', 'normal', 'comfortable'].includes(savedCardSize)) setCardSize(savedCardSize);
      if (savedViewMode && ['grid', 'list'].includes(savedViewMode)) setViewMode(savedViewMode);
    }
  }, []);

  // Разрешаем категорию из URL slug
  useEffect(() => {
    if (!isCategoriesLoading && categories.length > 0) {
      const catParam = searchParams.get('category');
      if (catParam) {
        const found = categories.find(c => c.slug === catParam) || categories.find(c => c.id === catParam);
        if (found) setSelectedCategory(found.id);
      } else {
        setSelectedCategory(null);
      }
    }
  }, [isCategoriesLoading, categories, searchParams]);

  const handleGridSizeChange = (size: GridSize) => {
    setGridSize(size);
    localStorage?.setItem('catalog_grid_size', size);
  };
  const handleCardSizeChange = (size: CardSize) => {
    setCardSize(size);
    localStorage?.setItem('catalog_card_size', size);
  };
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage?.setItem('catalog_view_mode', mode);
  };

  // Загрузка — только когда не в шоукейс-режиме
  useEffect(() => {
    if (!isAuthLoading && !isCategoriesLoading && !isShowcaseMode) {
      loadProducts();
    }
  }, [selectedCategory, sortBy, isAuthLoading, isCategoriesLoading, isShowcaseMode]);

  const loadProducts = async () => {
    let categoryIds: string[] | undefined;
    if (selectedCategory) {
      const subs = getSubcategories(selectedCategory);
      categoryIds = subs.length > 0 
        ? [selectedCategory, ...subs.map(s => s.id)]
        : [selectedCategory];
    }

    await searchProducts({
      query: searchQuery || undefined,
      categoryId: categoryIds?.length === 1 ? categoryIds[0] : undefined,
      categoryIds: categoryIds && categoryIds.length > 1 ? categoryIds : undefined,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
      sortBy: sortBy === 'popular' ? 'newest' : sortBy,
    });
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const cat = getCategoryById(categoryId);
    if (cat) {
      router.push(`/catalog?category=${cat.slug}`, { scroll: false });
    }
  };

  const handleBackToCategories = () => {
    const current = selectedCategory ? getCategoryById(selectedCategory) : null;
    if (current?.parent_id) {
      const parent = getCategoryById(current.parent_id);
      if (parent) {
        setSelectedCategory(parent.id);
        router.push(`/catalog?category=${parent.slug}`, { scroll: false });
        return;
      }
    }
    setSelectedCategory(null);
    router.push('/catalog', { scroll: false });
  };

  const currentCategory = selectedCategory ? getCategoryById(selectedCategory) : null;
  const currentParentCategory = currentCategory?.parent_id ? getCategoryById(currentCategory.parent_id) : null;
  const currentSubcategories = selectedCategory ? getSubcategories(selectedCategory) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) loadProducts();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('newest');
    setPriceRange({ min: '', max: '' });
    router.push('/catalog', { scroll: false });
  };

  const activeFiltersCount = [selectedCategory, priceRange.min, priceRange.max, searchQuery].filter(Boolean).length;

  /* ═══════════════ LOADING ═══════════════ */
  if (isCategoriesLoading) {
    return (
      <div className="min-h-screen bg-[#121212]">
        <Header />

        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Search skeleton */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>

          {/* Categories showcase skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-[4/3] bg-[#252525]">
                <div className="p-4 h-full flex flex-col justify-end">
                  <Skeleton className="h-6 w-3/4 rounded-md mb-2" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:flex lg:gap-8">
            {/* Sidebar skeleton */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm p-5 space-y-4">
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </aside>

            {/* Main content skeleton */}
            <main className="flex-1">
              <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm p-4 sm:p-6 mb-6">
                <Skeleton className="h-6 w-40 rounded-md" />
              </div>

              <div className={cn("grid", getGridClass(gridSize), getGapClass(cardSize))}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} size={cardSize === 'compact' ? 'compact' : cardSize === 'comfortable' ? 'comfortable' : 'normal'} />
                ))}
              </div>
            </main>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  /* ═══════════════ SHOWCASE MODE ═══════════════ */
  if (isShowcaseMode) {
    return (
      <div className="min-h-screen bg-[#121212]">
        <Header />
        
        {/* Поиск */}
        <div className="bg-[#1E1E1E] border-b border-[#2A2A2A]">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) loadProducts(); }} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666]" />
                <input
                  type="text"
                  placeholder="Поиск товаров по названию, бренду..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#121212] border border-[#2A2A2A] rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 transition-all"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Категории */}
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <CategoriesShowcase
            parentCategories={parentCategories}
            getSubcategories={getSubcategories}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        <Footer />
      </div>
    );
  }

  /* ═══════════════ PRODUCTS MODE ═══════════════ */
  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />

      {/* Шапка с хлебными крошками */}
      <div className="bg-[#1E1E1E] border-b border-[#2A2A2A]">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-2 text-sm text-[#666] mb-2">
            <Link href="/catalog" className="hover:text-gold-500 transition-colors">Каталог</Link>
            {currentParentCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <button onClick={() => handleSelectCategory(currentParentCategory.id)} className="hover:text-gold-500 transition-colors">
                  {currentParentCategory.name}
                </button>
              </>
            )}
            {currentCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#C0C0C0] font-medium">{currentCategory.name}</span>
              </>
            )}
            {searchQuery && !currentCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#C0C0C0] font-medium">Поиск: &laquo;{searchQuery}&raquo;</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#F5F5F5]">
              {currentCategory?.name || 'Результаты поиска'}
            </h1>
            <span className="text-sm text-[#666]">
              {isProductsLoading ? '...' : `${products.length} товаров`}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Баннер категории */}
        {currentCategory && (
          <ActiveCategoryBanner
            category={currentCategory}
            parentCategory={currentParentCategory}
            subcategories={currentSubcategories}
            onBack={handleBackToCategories}
            onSelectSub={handleSelectCategory}
          />
        )}

        <div className="flex gap-6 lg:gap-8">
          {/* ═══ SIDEBAR ═══ */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm p-5 sticky top-24 space-y-6">
              {/* Поиск */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#121212] border-[#2A2A2A] rounded-xl h-10"
                  />
                </div>
              </form>

              <Separator className="bg-[#252525]" />

              {/* Категории */}
              <div>
                <h3 className="font-semibold text-[#F5F5F5] mb-3 text-sm uppercase tracking-wide">Категории</h3>
                <div className="space-y-0.5">
                  <button
                    onClick={() => { setSelectedCategory(null); router.push('/catalog', { scroll: false }); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                      !selectedCategory 
                        ? "bg-gold-500/10 text-gold-600 font-semibold" 
                        : "text-[#A0A0A0] hover:bg-[#121212] hover:text-[#F5F5F5]"
                    )}
                  >
                    Все категории
                  </button>
                  {parentCategories.map((cat) => {
                    const subs = getSubcategories(cat.id);
                    const isParentSelected = selectedCategory === cat.id;
                    const isChildSelected = subs.some(s => s.id === selectedCategory);
                    const isExpanded = isParentSelected || isChildSelected;
                    
                    return (
                      <div key={cat.id}>
                        <button
                          onClick={() => handleSelectCategory(cat.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between",
                            isExpanded 
                              ? "bg-gold-500/10 text-gold-600 font-semibold" 
                              : "text-[#A0A0A0] hover:bg-[#121212] hover:text-[#F5F5F5]"
                          )}
                        >
                          <span>{cat.name}</span>
                          {subs.length > 0 && (
                            <ChevronRight className={cn(
                              "w-4 h-4 transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )} />
                          )}
                        </button>
                        {isExpanded && subs.length > 0 && (
                          <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l-2 border-gold-500/30 pl-3">
                            {subs.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => handleSelectCategory(sub.id)}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all",
                                  selectedCategory === sub.id
                                    ? "text-gold-600 font-semibold bg-gold-500/10"
                                    : "text-[#A0A0A0] hover:text-[#C0C0C0] hover:bg-[#121212]"
                                )}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-[#252525]" />

              {/* Цена */}
              <div>
                <h3 className="font-semibold text-[#F5F5F5] mb-3 text-sm uppercase tracking-wide">Цена, ₸</h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="От"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="bg-[#121212] border-[#2A2A2A] rounded-xl h-10"
                  />
                  <span className="text-gray-300">—</span>
                  <Input
                    type="number"
                    placeholder="До"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="bg-[#121212] border-[#2A2A2A] rounded-xl h-10"
                  />
                </div>
                <Button
                  onClick={loadProducts}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 border-[#2A2A2A] text-[#A0A0A0] hover:bg-gold-500/10 hover:text-gold-600 hover:border-gold-500/30 rounded-xl"
                >
                  Применить
                </Button>
              </div>

              {/* Сброс */}
              {activeFiltersCount > 0 && (
                <>
                  <Separator className="bg-[#252525]" />
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="w-full text-gold-500 hover:text-gold-600 hover:bg-gold-500/10"
                  >
                    Сбросить все фильтры
                  </Button>
                </>
              )}
            </div>
          </aside>

          {/* ═══ MAIN CONTENT ═══ */}
          <main className="flex-1 min-w-0">
            {/* Панель управления */}
            <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm p-3 sm:p-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                {/* Мобильные фильтры */}
                <Button
                  onClick={() => setShowFilters(true)}
                  variant="outline"
                  size="sm"
                  className="lg:hidden gap-2 border-[#2A2A2A] rounded-xl"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Фильтры
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-1 bg-gold-500 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Сортировка */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-[#666] hidden sm:block" />
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] bg-[#1E1E1E] border-[#2A2A2A] h-9 text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
                      {sortOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-[#C0C0C0] focus:bg-gold-500/10 focus:text-gold-600">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1" />

                {/* Размер карточек */}
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-[#666]">Размер:</span>
                  <Select value={cardSize} onValueChange={(v) => handleCardSizeChange(v as CardSize)}>
                    <SelectTrigger className="w-[110px] bg-[#1E1E1E] border-[#2A2A2A] h-9 text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
                      {cardSizeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-[#C0C0C0] focus:bg-gold-500/10 focus:text-gold-600">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Колонки */}
                <div className="hidden sm:flex items-center border border-[#2A2A2A] rounded-xl overflow-hidden">
                  {gridOptions.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => handleGridSizeChange(o.value)}
                      title={`${o.cols} колонок`}
                      className={cn(
                        "px-2.5 py-1.5 text-sm font-medium transition-colors min-w-[32px]",
                        gridSize === o.value 
                          ? "bg-gold-500/10 text-gold-600" 
                          : "text-[#666] hover:text-[#A0A0A0] hover:bg-[#121212]"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {/* Режим отображения */}
                <div className="flex items-center border border-[#2A2A2A] rounded-xl overflow-hidden">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === 'grid' ? "bg-gold-500/10 text-gold-600" : "text-[#666] hover:text-[#A0A0A0] hover:bg-[#121212]"
                    )}
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === 'list' ? "bg-gold-500/10 text-gold-600" : "text-[#666] hover:text-[#A0A0A0] hover:bg-[#121212]"
                    )}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Товары */}
            {isProductsLoading ? (
              viewMode === 'list' ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardCompactSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className={cn("grid", getGridClass(gridSize), getGapClass(cardSize))}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <ProductCardSkeleton key={i} size={cardSize === 'compact' ? 'compact' : cardSize === 'comfortable' ? 'comfortable' : 'normal'} />
                  ))}
                </div>
              )
            ) : products.length === 0 ? (
              <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm py-16 text-center">
                <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
                  Товары не найдены
                </h3>
                <p className="text-[#666] mb-6 max-w-sm mx-auto">
                  В этой категории пока нет товаров. Попробуйте выбрать другую категорию.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={handleBackToCategories} variant="outline" className="gap-2 rounded-xl border-[#2A2A2A]">
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                  </Button>
                  <Button onClick={clearFilters} className="bg-gold-500 hover:bg-gold-600 rounded-xl gap-2">
                    <Tag className="w-4 h-4" />
                    Все категории
                  </Button>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCardCompact key={product.id} product={product} showPrice={canBuy} />
                ))}
              </div>
            ) : (
              <div className={cn("grid", getGridClass(gridSize), getGapClass(cardSize))}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} size={cardSize} showPrice={canBuy} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ═══ MOBILE FILTERS MODAL ═══ */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#1E1E1E] shadow-xl overflow-y-auto">
            {/* Шапка */}
            <div className="sticky top-0 bg-[#1E1E1E] border-b border-[#2A2A2A] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Filter className="h-4 w-4 text-gold-500" />
                Фильтры
              </h2>
              <button onClick={() => setShowFilters(false)} className="p-1.5 text-[#666] hover:text-[#A0A0A0] hover:bg-[#252525] rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Отображение */}
              <div>
                <h3 className="font-semibold text-[#F5F5F5] mb-3 text-sm uppercase tracking-wide">Отображение</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-[#A0A0A0] mb-1 block">Колонок</label>
                    <Select value={gridSize} onValueChange={(v) => handleGridSizeChange(v as GridSize)}>
                      <SelectTrigger className="w-full bg-[#121212] border-[#2A2A2A] rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
                        {gridOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-[#C0C0C0]">{o.cols} колонок</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-[#A0A0A0] mb-1 block">Размер карточек</label>
                    <Select value={cardSize} onValueChange={(v) => handleCardSizeChange(v as CardSize)}>
                      <SelectTrigger className="w-full bg-[#121212] border-[#2A2A2A] rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
                        {cardSizeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-[#C0C0C0]">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="bg-[#252525]" />

              {/* Поиск */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#121212] border-[#2A2A2A] rounded-xl"
                  />
                </div>
              </div>

              <Separator className="bg-[#252525]" />

              {/* Категории */}
              <div>
                <h3 className="font-semibold text-[#F5F5F5] mb-3 text-sm uppercase tracking-wide">Категории</h3>
                <div className="space-y-0.5">
                  <button
                    onClick={() => { setSelectedCategory(null); setShowFilters(false); router.push('/catalog', { scroll: false }); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                      !selectedCategory ? "bg-gold-500/10 text-gold-600 font-semibold" : "text-[#A0A0A0] hover:bg-[#121212]"
                    )}
                  >
                    Все категории
                  </button>
                  {parentCategories.map((cat) => {
                    const subs = getSubcategories(cat.id);
                    const isChildSelected = subs.some(s => s.id === selectedCategory);
                    const isExpanded = selectedCategory === cat.id || isChildSelected;
                    return (
                      <div key={cat.id}>
                        <button
                          onClick={() => { handleSelectCategory(cat.id); if (subs.length === 0) setShowFilters(false); }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                            isExpanded ? "bg-gold-500/10 text-gold-600 font-semibold" : "text-[#A0A0A0] hover:bg-[#121212]"
                          )}
                        >
                          {cat.name}
                        </button>
                        {isExpanded && subs.length > 0 && (
                          <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l-2 border-gold-500/30 pl-3">
                            {subs.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => { handleSelectCategory(sub.id); setShowFilters(false); }}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all",
                                  selectedCategory === sub.id ? "text-gold-600 font-semibold bg-gold-500/10" : "text-[#A0A0A0] hover:bg-[#121212]"
                                )}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-[#252525]" />

              {/* Цена */}
              <div>
                <h3 className="font-semibold text-[#F5F5F5] mb-3 text-sm uppercase tracking-wide">Цена, ₸</h3>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="От" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} className="bg-[#121212] border-[#2A2A2A] rounded-xl" />
                  <span className="text-gray-300">—</span>
                  <Input type="number" placeholder="До" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} className="bg-[#121212] border-[#2A2A2A] rounded-xl" />
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-2">
                <Button onClick={clearFilters} variant="outline" className="flex-1 border-[#2A2A2A] rounded-xl">
                  Сбросить
                </Button>
                <Button onClick={() => { loadProducts(); setShowFilters(false); }} className="flex-1 bg-gold-500 hover:bg-gold-600 rounded-xl">
                  Применить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
