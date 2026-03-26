'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
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
  Tag,
  Table2,
  MessageCircle
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
import { useCart } from '@/hooks/useCart';
import { cn, formatPrice } from '@/lib/utils';
import type { Category } from '@/lib/types';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';
type GridSize = '1' | '2' | '3' | '4' | '5' | '6';
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

// Мобильные опции — только 1 и 2 колонки
const mobileGridOptions: { value: GridSize; label: string }[] = [
  { value: '1' as GridSize, label: '1' },
  { value: '2', label: '2' },
];

const cardSizeOptions: { value: CardSize; label: string }[] = [
  { value: 'compact', label: 'Компактные' },
  { value: 'normal', label: 'Стандартные' },
  { value: 'comfortable', label: 'Просторные' },
];

function getGridClass(gridSize: GridSize): string {
  switch (gridSize) {
    case '1': return 'grid-cols-1';
    case '2': return 'grid-cols-2';
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
   Табличный прайс-лист
   ───────────────────────────────────────────── */
function PriceListTable({ 
  products, 
  canBuy,
  addToCart 
}: { 
  products: Array<{ id: string; name: string; slug: string; brand?: string | null; price: number; old_price?: number | null; in_stock: boolean; stock?: number; order_step?: number; sku?: string | null }>;
  canBuy: boolean;
  addToCart: (productId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
}) {
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAdd = async (productId: string, orderStep: number) => {
    setAddingId(productId);
    const result = await addToCart(productId, orderStep);
    if (result.success) {
      toast.success('Добавлено в корзину');
    } else {
      toast.error(result.error || 'Ошибка');
    }
    setAddingId(null);
  };

  const whatsappNumber = '77008001800';

  return (
    <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2A2A] bg-[#181818]">
              <th className="text-left px-4 py-3 font-semibold text-[#A0A0A0] text-xs uppercase tracking-wider">Наименование</th>
              <th className="text-left px-4 py-3 font-semibold text-[#A0A0A0] text-xs uppercase tracking-wider hidden sm:table-cell">Бренд</th>
              <th className="text-left px-4 py-3 font-semibold text-[#A0A0A0] text-xs uppercase tracking-wider hidden md:table-cell">Артикул</th>
              {canBuy && (
                <th className="text-right px-4 py-3 font-semibold text-[#A0A0A0] text-xs uppercase tracking-wider">Цена</th>
              )}
              <th className="text-center px-4 py-3 font-semibold text-[#A0A0A0] text-xs uppercase tracking-wider">Наличие</th>
              <th className="text-center px-4 py-3 font-semibold text-[#A0A0A0] text-xs uppercase tracking-wider w-[120px]"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const orderStep = product.order_step || 1;
              const outOfStock = !product.in_stock || (product.stock !== undefined && product.stock <= 0);
              return (
                <tr 
                  key={product.id} 
                  className={cn(
                    "border-b border-[#2A2A2A]/50 hover:bg-[#252525] transition-colors",
                    idx % 2 === 0 ? "bg-[#1E1E1E]" : "bg-[#1B1B1B]"
                  )}
                >
                  <td className="px-4 py-3">
                    <Link href={`/product/${product.slug}`} className="text-[#F5F5F5] hover:text-gold-500 transition-colors font-medium">
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#A0A0A0] hidden sm:table-cell">{product.brand || '—'}</td>
                  <td className="px-4 py-3 text-[#666] hidden md:table-cell font-mono text-xs">{product.sku || '—'}</td>
                  {canBuy && (
                    <td className="px-4 py-3 text-right">
                      <span className="text-[#F5F5F5] font-semibold">{formatPrice(product.price)}</span>
                      {product.old_price && product.old_price > product.price && (
                        <span className="text-[#666] line-through text-xs ml-2">{formatPrice(product.old_price)}</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    {outOfStock ? (
                      <span className="text-red-400 text-xs">Уточнить наличие</span>
                    ) : (
                      <span className="text-green-400 text-xs">В наличии</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {outOfStock ? (
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Здравствуйте! Интересует наличие: ${product.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Уточнить наличие
                      </a>
                    ) : canBuy ? (
                      <button
                        onClick={() => handleAdd(product.id, orderStep)}
                        disabled={addingId === product.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gold-500/20 text-gold-500 hover:bg-gold-500/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {addingId === product.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                        {orderStep > 1 ? `× ${orderStep}` : 'В корзину'}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  const { searchProducts, products, isLoading: isProductsLoading, error: productsError } = useProducts();
  const { categories, parentCategories, getSubcategories, getCategoryById, isLoading: isCategoriesLoading } = useCategories();
  const { addToCart } = useCart();

  // Можно ли показывать цены/корзину: авторизован
  const canBuy = !!user;
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [gridSize, setGridSize] = useState<GridSize>('2');
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

  // Настройки из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGridSize = localStorage.getItem('catalog_grid_size') as GridSize;
      const savedCardSize = localStorage.getItem('catalog_card_size') as CardSize;
      const savedViewMode = localStorage.getItem('catalog_view_mode') as 'grid' | 'list' | 'table';
      if (savedGridSize && ['1', '2', '3', '4', '5', '6'].includes(savedGridSize)) setGridSize(savedGridSize);
      if (savedCardSize && ['compact', 'normal', 'comfortable'].includes(savedCardSize)) setCardSize(savedCardSize);
      if (savedViewMode && ['grid', 'list', 'table'].includes(savedViewMode)) setViewMode(savedViewMode);
    }
  }, []);

  // Разрешаем категорию из URL slug (когда категории загрузятся)
  useEffect(() => {
    if (isCategoriesLoading) return;
    const catParam = searchParams.get('category');
    if (catParam && categories.length > 0) {
      const found = categories.find(c => c.slug === catParam) || categories.find(c => c.id === catParam);
      if (found) {
        setSelectedCategory(found.id);
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
  const handleViewModeChange = (mode: 'grid' | 'list' | 'table') => {
    setViewMode(mode);
    localStorage?.setItem('catalog_view_mode', mode);
  };

  // Загрузка товаров — НЕ зависит от авторизации (товары публичные)
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, sortBy]);

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
  /* ═══════════════ PRODUCTS MODE ═══════════════ */
  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />

      {/* ═══ STICKY 8-TAB HORIZONTAL MENU ═══ */}
      <div className="sticky top-0 z-40 bg-[#1E1E1E] border-b border-[#2A2A2A] shadow-lg shadow-black/20">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto py-1 -mx-2 px-2 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => { setSelectedCategory(null); router.push('/catalog', { scroll: false }); }}
              className={cn(
                "whitespace-nowrap px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-all border-b-2 flex-shrink-0",
                !selectedCategory
                  ? "border-gold-500 text-gold-500"
                  : "border-transparent text-[#A0A0A0] hover:text-[#F5F5F5] hover:border-[#666]"
              )}
            >
              Все
            </button>
            {isCategoriesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 px-2">
                  <Skeleton className="h-4 w-16 rounded-md my-3" />
                </div>
              ))
            ) : parentCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={cn(
                    "whitespace-nowrap px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-all border-b-2 flex-shrink-0",
                    isActive
                      ? "border-gold-500 text-gold-500"
                      : "border-transparent text-[#A0A0A0] hover:text-[#F5F5F5] hover:border-[#666]"
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Шапка с хлебными крошками */}
      <div className="bg-[#1E1E1E]/50 border-b border-[#2A2A2A]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#666]">
              <Link href="/catalog" className="hover:text-gold-500 transition-colors">Каталог</Link>
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
            <span className="text-sm text-[#666]">
              {isProductsLoading ? '...' : `${products.length} товаров`}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
                  {isCategoriesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full rounded-xl" />
                    ))
                  ) : parentCategories.map((cat) => {
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
            <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm p-2.5 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Мобильные фильтры */}
                <Button
                  onClick={() => setShowFilters(true)}
                  variant="outline"
                  size="sm"
                  className="lg:hidden gap-1.5 border-[#2A2A2A] rounded-xl h-9 px-3"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden xs:inline">Фильтры</span>
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-gold-500 h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Сортировка */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-[#666] hidden sm:block" />
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[130px] sm:w-[160px] bg-[#1E1E1E] border-[#2A2A2A] h-9 text-xs sm:text-sm rounded-xl">
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
                    title="Сетка"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === 'list' ? "bg-gold-500/10 text-gold-600" : "text-[#666] hover:text-[#A0A0A0] hover:bg-[#121212]"
                    )}
                    title="Список"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === 'table' ? "bg-gold-500/10 text-gold-600" : "text-[#666] hover:text-[#A0A0A0] hover:bg-[#121212]"
                    )}
                    title="Прайс-лист"
                  >
                    <Table2 className="h-4 w-4" />
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
              ) : viewMode === 'table' ? (
                <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] overflow-hidden">
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className={cn("grid", getGridClass(gridSize), getGapClass(cardSize))}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <ProductCardSkeleton key={i} size={cardSize === 'compact' ? 'compact' : cardSize === 'comfortable' ? 'comfortable' : 'normal'} />
                  ))}
                </div>
              )
            ) : productsError ? (
              <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] shadow-sm py-16 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
                  Ошибка загрузки
                </h3>
                <p className="text-[#666] mb-6 max-w-sm mx-auto">
                  Не удалось загрузить товары. Попробуйте обновить страницу.
                </p>
                <Button onClick={loadProducts} className="bg-gold-500 hover:bg-gold-600 rounded-xl gap-2">
                  Попробовать снова
                </Button>
              </div>
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
            ) : viewMode === 'table' ? (
              <PriceListTable products={products} canBuy={canBuy} addToCart={addToCart} />
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
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-80 bg-[#1A1A1A] shadow-2xl flex flex-col">
            {/* Шапка — sticky */}
            <div className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-5 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Filter className="h-4 w-4 text-gold-500" />
                Фильтры
                {activeFiltersCount > 0 && (
                  <Badge className="bg-gold-500 text-white text-[10px] h-5 min-w-[20px] px-1.5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </h2>
              <button onClick={() => setShowFilters(false)} className="p-2 text-[#666] hover:text-[#A0A0A0] hover:bg-[#252525] rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Скроллируемое содержимое */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Вид отображения */}
              <div>
                <h3 className="font-semibold text-[#F5F5F5] mb-3 text-sm uppercase tracking-wide">Вид</h3>
                <div className="flex items-center gap-1.5 bg-[#121212] rounded-xl p-1 border border-[#2A2A2A]">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                      viewMode === 'grid' ? "bg-gold-500/15 text-gold-500" : "text-[#666] hover:text-[#A0A0A0]"
                    )}
                  >
                    <Grid2X2 className="h-3.5 w-3.5" />
                    Сетка
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                      viewMode === 'list' ? "bg-gold-500/15 text-gold-500" : "text-[#666] hover:text-[#A0A0A0]"
                    )}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    Список
                  </button>
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                      viewMode === 'table' ? "bg-gold-500/15 text-gold-500" : "text-[#666] hover:text-[#A0A0A0]"
                    )}
                  >
                    <Table2 className="h-3.5 w-3.5" />
                    Прайс
                  </button>
                </div>
              </div>

              {/* Колонки — только для grid, мобильные 1 и 2 */}
              {viewMode === 'grid' && (
                <div>
                  <h3 className="font-semibold text-[#F5F5F5] mb-3 text-sm uppercase tracking-wide">Колонки</h3>
                  <div className="flex items-center gap-1.5 bg-[#121212] rounded-xl p-1 border border-[#2A2A2A]">
                    {mobileGridOptions.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => handleGridSizeChange(o.value)}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                          gridSize === o.value || (gridSize !== '1' && gridSize !== '2' && o.value === '2')
                            ? "bg-gold-500/15 text-gold-500"
                            : "text-[#666] hover:text-[#A0A0A0]"
                        )}
                      >
                        {o.value === '1' ? '1 колонка' : '2 колонки'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="bg-[#252525]" />

              {/* Категории */}
              <div>
                <h3 className="font-semibold text-[#F5F5F5] mb-3 text-sm uppercase tracking-wide">Категории</h3>
                <div className="space-y-0.5 max-h-[280px] overflow-y-auto hide-scrollbar">
                  <button
                    onClick={() => { setSelectedCategory(null); router.push('/catalog', { scroll: false }); }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all",
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
                          onClick={() => handleSelectCategory(cat.id)}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between",
                            isExpanded ? "bg-gold-500/10 text-gold-600 font-semibold" : "text-[#A0A0A0] hover:bg-[#121212]"
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
                                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
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
                  <span className="text-[#666]">—</span>
                  <Input type="number" placeholder="До" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} className="bg-[#121212] border-[#2A2A2A] rounded-xl" />
                </div>
              </div>

              {/* Нижний отступ под sticky кнопки */}
              <div className="h-4" />
            </div>

            {/* Sticky кнопки внизу — выше MobileTabBar */}
            <div className="flex-shrink-0 bg-[#1A1A1A] border-t border-[#2A2A2A] px-5 pt-4 pb-6">
              <div className="flex gap-3">
                <Button onClick={() => { clearFilters(); setShowFilters(false); }} variant="outline" className="flex-1 h-11 border-[#2A2A2A] rounded-xl text-[#A0A0A0]">
                  Сбросить
                </Button>
                <Button onClick={() => { loadProducts(); setShowFilters(false); }} className="flex-1 h-11 bg-gold-500 hover:bg-gold-600 rounded-xl font-semibold">
                  Показать товары
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Нижний отступ для MobileTabBar */}
      <div className="h-16 lg:hidden" />

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
