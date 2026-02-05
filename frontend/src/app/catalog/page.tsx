'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  SlidersHorizontal, 
  Grid2X2,
  Grid3X3, 
  LayoutGrid,
  LayoutList, 
  ShoppingCart,
  X,
  Loader2,
  Filter,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard, ProductCardCompact } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { useProducts, ProductSearchResult } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

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

// Получение класса сетки по количеству колонок
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

// Получение gap по размеру карточки
function getGapClass(cardSize: CardSize): string {
  switch (cardSize) {
    case 'compact': return 'gap-2 sm:gap-3';
    case 'normal': return 'gap-3 sm:gap-4';
    case 'comfortable': return 'gap-4 sm:gap-5';
    default: return 'gap-4';
  }
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { searchProducts, products, isLoading: isProductsLoading } = useProducts();
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridSize, setGridSize] = useState<GridSize>('4');
  const [cardSize, setCardSize] = useState<CardSize>('normal');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest'
  );
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });

  // Загрузка настроек из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGridSize = localStorage.getItem('catalog_grid_size') as GridSize;
      const savedCardSize = localStorage.getItem('catalog_card_size') as CardSize;
      const savedViewMode = localStorage.getItem('catalog_view_mode') as 'grid' | 'list';
      
      if (savedGridSize && ['2', '3', '4', '5', '6'].includes(savedGridSize)) {
        setGridSize(savedGridSize);
      }
      if (savedCardSize && ['compact', 'normal', 'comfortable'].includes(savedCardSize)) {
        setCardSize(savedCardSize);
      }
      if (savedViewMode && ['grid', 'list'].includes(savedViewMode)) {
        setViewMode(savedViewMode);
      }
    }
  }, []);

  // Сохранение настроек в localStorage
  const handleGridSizeChange = (size: GridSize) => {
    setGridSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('catalog_grid_size', size);
    }
  };

  const handleCardSizeChange = (size: CardSize) => {
    setCardSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('catalog_card_size', size);
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('catalog_view_mode', mode);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      loadProducts();
    }
  }, [selectedCategory, sortBy, isAuthLoading]);

  const loadProducts = async () => {
    await searchProducts({
      query: searchQuery || undefined,
      categoryId: selectedCategory || undefined,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
      sortBy: sortBy === 'popular' ? 'newest' : sortBy,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('newest');
    setPriceRange({ min: '', max: '' });
    router.push('/catalog');
  };

  const activeFiltersCount = [
    selectedCategory,
    priceRange.min,
    priceRange.max,
    searchQuery,
  ].filter(Boolean).length;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Каталог товаров</h1>
          </div>
          <p className="text-gray-500">
            {products.length} товаров найдено
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card className="bg-white border-gray-200 shadow-sm sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-orange-500" />
                    Фильтры
                  </h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Сбросить ({activeFiltersCount})
                    </button>
                  )}
                </div>

                {/* Search in filters */}
                <div className="mb-6">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-50 border-gray-200"
                      />
                    </div>
                  </form>
                </div>

                <Separator className="bg-gray-100 mb-6" />

                {/* Categories */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Категории</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        !selectedCategory 
                          ? "bg-orange-50 text-orange-600 font-medium" 
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      Все категории
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          selectedCategory === cat.id 
                            ? "bg-orange-50 text-orange-600 font-medium" 
                            : "text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-gray-100 mb-6" />

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Цена, ₸</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="От"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="bg-gray-50 border-gray-200"
                    />
                    <span className="text-gray-400">—</span>
                    <Input
                      type="number"
                      placeholder="До"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                  <Button
                    onClick={loadProducts}
                    variant="outline"
                    className="w-full mt-3 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                  >
                    Применить
                  </Button>
                </div>

                {/* Promo Banner */}
                <div className="mt-6 p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
                  <p className="font-semibold mb-1">🔥 Скидки до 30%</p>
                  <p className="text-sm text-orange-100">На популярные товары</p>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Controls Bar */}
            <Card className="bg-white border-gray-200 shadow-sm mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Mobile Filter Button */}
                  <Button
                    onClick={() => setShowFilters(true)}
                    variant="outline"
                    size="sm"
                    className="lg:hidden gap-2 border-gray-200"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Фильтры
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1 bg-orange-500 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-gray-400 hidden sm:block" />
                    <Select
                      value={sortBy}
                      onValueChange={(value) => setSortBy(value as SortOption)}
                    >
                      <SelectTrigger className="w-[140px] sm:w-[160px] bg-white border-gray-200 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {sortOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="text-gray-700 focus:bg-orange-50 focus:text-orange-600"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1" />

                  {/* Card Size Selector */}
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-gray-500">Размер:</span>
                    <Select
                      value={cardSize}
                      onValueChange={(value) => handleCardSizeChange(value as CardSize)}
                    >
                      <SelectTrigger className="w-[110px] bg-white border-gray-200 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {cardSizeOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="text-gray-700 focus:bg-orange-50 focus:text-orange-600"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grid Size Selector */}
                  <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    {gridOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleGridSizeChange(option.value)}
                        title={`${option.cols} колонок`}
                        className={cn(
                          "px-2.5 py-1.5 text-sm font-medium transition-colors min-w-[32px]",
                          gridSize === option.value 
                            ? "bg-orange-50 text-orange-600" 
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleViewModeChange('grid')}
                      className={cn(
                        "p-2 transition-colors",
                        viewMode === 'grid' 
                          ? "bg-orange-50 text-orange-600" 
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={cn(
                        "p-2 transition-colors",
                        viewMode === 'list' 
                          ? "bg-orange-50 text-orange-600" 
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <LayoutList className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            {isProductsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Товары не найдены
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Попробуйте изменить параметры поиска
                  </p>
                  <Button onClick={clearFilters} className="bg-orange-500 hover:bg-orange-600">
                    Сбросить фильтры
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'list' ? (
              // List View
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCardCompact 
                    key={product.id} 
                    product={product}
                  />
                ))}
              </div>
            ) : (
              // Grid View с настраиваемым размером
              <div className={cn(
                "grid",
                getGridClass(gridSize),
                getGapClass(cardSize)
              )}>
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    size={cardSize}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowFilters(false)} 
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-orange-500" />
                Фильтры
              </h2>
              <button 
                onClick={() => setShowFilters(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Display Settings */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Отображение</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Колонок</label>
                  <Select
                    value={gridSize}
                    onValueChange={(value) => handleGridSizeChange(value as GridSize)}
                  >
                    <SelectTrigger className="w-full bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {gridOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="text-gray-700"
                        >
                          {option.cols} колонок
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Размер карточек</label>
                  <Select
                    value={cardSize}
                    onValueChange={(value) => handleCardSizeChange(value as CardSize)}
                  >
                    <SelectTrigger className="w-full bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {cardSizeOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="text-gray-700"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-100 mb-6" />

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <Separator className="bg-gray-100 mb-6" />

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Категории</h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedCategory(null); setShowFilters(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !selectedCategory 
                      ? "bg-orange-50 text-orange-600 font-medium" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  Все категории
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setShowFilters(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === cat.id 
                        ? "bg-orange-50 text-orange-600 font-medium" 
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-gray-100 mb-6" />

            {/* Price */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Цена, ₸</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="От"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
                <span className="text-gray-400">—</span>
                <Input
                  type="number"
                  placeholder="До"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="flex-1 border-gray-200"
              >
                Сбросить
              </Button>
              <Button
                onClick={() => { loadProducts(); setShowFilters(false); }}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Применить
              </Button>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
