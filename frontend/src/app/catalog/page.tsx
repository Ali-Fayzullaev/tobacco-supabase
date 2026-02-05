'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  ChevronDown,
  Heart,
  ShoppingCart,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { useProducts, ProductSearchResult } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPrice } from '@/lib/utils';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Сначала дешевые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
  { value: 'popular', label: 'По популярности' },
];

interface ProductCardProps {
  product: ProductSearchResult;
  viewMode: 'grid' | 'list';
}

function ProductCard({ product, viewMode }: ProductCardProps) {
  const { addToCart, isLoading: isCartLoading } = useCart();
  const { toggleFavorite, isFavorite, isLoading: isFavLoading } = useFavorites();
  const isFav = isFavorite(product.id);
  const inStock = product.in_stock;

  const handleAddToCart = async () => {
    await addToCart(product.id, 1);
  };

  const handleToggleFavorite = async () => {
    await toggleFavorite(product.id);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow">
        <Link href={`/product/${product.slug}`} className="flex-shrink-0">
          <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Нет фото
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 flex flex-col">
          <Link href={`/product/${product.slug}`} className="hover:text-gold-600">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
          </Link>
          {product.brand && (
            <p className="text-sm text-gray-500">{product.brand}</p>
          )}
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">
            {product.description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-lg font-bold text-gold-600">
              {formatPrice(product.price)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                disabled={isFavLoading}
                className={`p-2 rounded-lg transition-colors ${
                  isFav 
                    ? 'bg-red-50 text-red-500' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isCartLoading || !inStock}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                В корзину
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square bg-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Нет фото
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium">Нет в наличии</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/product/${product.slug}`} className="hover:text-gold-600">
          <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
        </Link>
        {product.brand && (
          <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-gold-600">
            {formatPrice(product.price)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleFavorite}
              disabled={isFavLoading}
              className={`p-2 rounded-lg transition-colors ${
                isFav 
                  ? 'text-red-500' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={isCartLoading || !inStock}
              className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { searchProducts, products, isLoading: isProductsLoading } = useProducts();
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  // Загружаем товары при изменении фильтров
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
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', String(selectedCategory));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    router.push(`/catalog?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('newest');
    setPriceRange({ min: '', max: '' });
    router.push('/catalog');
  };

  // Show loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-gold-500">
              Tobacco Shop KZ
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/catalog" className="text-gray-900 font-medium">
                Каталог
              </Link>
              <Link href="/cart" className="text-gray-600 hover:text-gray-900">
                Корзина
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                Профиль
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900">Фильтры</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gold-600 hover:underline"
                >
                  Сбросить
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Категории</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedCategory 
                        ? 'bg-gold-50 text-gold-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Все категории
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === cat.id 
                          ? 'bg-gold-50 text-gold-700' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Цена</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="До"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={loadProducts}
                  className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  Применить
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search and Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Поиск товаров..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>
                </form>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    Фильтры
                  </button>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-gray-700 bg-white cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* View Mode */}
                  <div className="hidden sm:flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isProductsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Товары не найдены</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-gold-600 hover:underline"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    viewMode={viewMode} 
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900">Фильтры</h2>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Категории</h3>
              <div className="space-y-2">
                <button
                  onClick={() => { setSelectedCategory(null); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    !selectedCategory ? 'bg-gold-50 text-gold-700' : 'text-gray-600'
                  }`}
                >
                  Все категории
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setShowFilters(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedCategory === cat.id ? 'bg-gold-50 text-gold-700' : 'text-gray-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Цена</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="От"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="До"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg"
              >
                Сбросить
              </button>
              <button
                onClick={() => { loadProducts(); setShowFilters(false); }}
                className="flex-1 py-2 bg-gold-500 text-white rounded-lg"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Warning Footer */}
      <footer className="bg-slate-900 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          Минздрав предупреждает: курение вредит Вашему здоровью
        </div>
      </footer>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
