'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Plus, Pencil, Trash2, Loader2, Layers, FolderOpen,
  GripVertical, Eye, EyeOff, Save, X, Upload, ChevronRight, 
  ImageIcon, ArrowUp, ArrowDown, FolderTree
} from 'lucide-react';
import { CenteredPageSkeleton, AdminCategoriesSkeleton } from '@/components/Skeleton';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    name_kk: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '' as string | null,
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const generateSlug = (name: string) => {
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    };
    return name.toLowerCase()
      .split('')
      .map(char => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const resetForm = () => {
    setForm({
      name: '', name_kk: '', slug: '', description: '',
      image_url: '', parent_id: null, sort_order: 0, is_active: true,
    });
    setEditingCategory(null);
    setIsCreating(false);
  };

  const startCreate = (parentId?: string) => {
    resetForm();
    setForm(prev => ({ 
      ...prev, 
      parent_id: parentId || null,
      sort_order: categories.length + 1 
    }));
    setIsCreating(true);
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      name_kk: category.name_kk || '',
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id || null,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Введите название категории');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const slug = form.slug || generateSlug(form.name);

      const categoryData = {
        name: form.name.trim(),
        name_kk: form.name_kk.trim() || null,
        slug,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        parent_id: form.parent_id || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      if (editingCategory?.id) {
        // Обновление
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        // Создание
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);
        if (error) throw error;
      }

      resetForm();
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);
      if (error) throw error;
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteCategory = async (category: Category) => {
    const subs = getSubcategories(category.id);
    if (subs.length > 0) {
      setError('Сначала удалите все подкатегории');
      return;
    }

    if (!confirm(`Удалить категорию «${category.name}»?`)) return;

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);
      if (error) throw error;
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const supabase = createBrowserSupabaseClient();
      const ext = file.name.split('.').pop();
      const fileName = `category-${Date.now()}.${ext}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      setForm(prev => ({ ...prev, image_url: data.publicUrl }));
    } catch (err: any) {
      setError(`Ошибка загрузки: ${err.message}`);
    }
  };

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;

    const siblings = cat.parent_id 
      ? getSubcategories(cat.parent_id)
      : parentCategories;
    
    const idx = siblings.findIndex(c => c.id === categoryId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    try {
      const supabase = createBrowserSupabaseClient();
      const currentOrder = cat.sort_order;
      const swapOrder = siblings[swapIdx].sort_order;

      await supabase.from('categories').update({ sort_order: swapOrder }).eq('id', cat.id);
      await supabase.from('categories').update({ sort_order: currentOrder }).eq('id', siblings[swapIdx].id);
      
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <AdminCategoriesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FolderTree className="w-8 h-8 text-orange-500" />
            Категории
          </h1>
          <p className="text-gray-500 mt-1">
            {parentCategories.length} категорий • {categories.length - parentCategories.length} подкатегорий
          </p>
        </div>
        <button
          onClick={() => startCreate()}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form */}
      {(isCreating || editingCategory) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Название *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm(prev => ({ 
                    ...prev, 
                    name: e.target.value,
                    slug: prev.slug || generateSlug(e.target.value)
                  }));
                }}
                placeholder="Например: Сигареты"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Name KK */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Название (казахский)
              </label>
              <input
                type="text"
                value={form.name_kk}
                onChange={(e) => setForm(prev => ({ ...prev, name_kk: e.target.value }))}
                placeholder="Қазақша атауы"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                URL (slug)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="cigarettes"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-mono text-sm"
              />
            </div>

            {/* Parent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Родительская категория
              </label>
              <select
                value={form.parent_id || ''}
                onChange={(e) => setForm(prev => ({ ...prev, parent_id: e.target.value || null }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              >
                <option value="">— Корневая категория —</option>
                {parentCategories
                  .filter(c => c.id !== editingCategory?.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
                }
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Описание
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание категории..."
                rows={2}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
              />
            </div>

            {/* Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Изображение
              </label>
              <div className="flex gap-4 items-start">
                {form.image_url ? (
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="URL изображения или загрузите файл"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                  />
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    Загрузить
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Sort Order + Active */}
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Порядок</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-24 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="sr-only"
                />
                <div className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  form.is_active ? "bg-orange-500" : "bg-gray-300"
                )}>
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm",
                    form.is_active ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </div>
                <span className="text-sm text-gray-700">Активна</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingCategory ? 'Сохранить' : 'Создать'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Categories Tree */}
      <div className="space-y-3">
        {parentCategories.map((category, idx) => {
          const subs = getSubcategories(category.id);
          
          return (
            <div key={category.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Parent Category */}
              <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                {/* Image */}
                <div className="w-16 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {category.image_url ? (
                    <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{category.name}</h3>
                    {!category.is_active && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Скрыта</span>
                    )}
                    {subs.length > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {subs.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    /{category.slug}
                    {category.description && ` • ${category.description}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={idx === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={idx === parentCategories.length - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(category)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      category.is_active 
                        ? "text-green-600 hover:bg-green-50" 
                        : "text-gray-400 hover:bg-gray-100"
                    )}
                    title={category.is_active ? 'Скрыть' : 'Показать'}
                  >
                    {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startCreate(category.id)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Добавить подкатегорию"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEdit(category)}
                    className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {subs.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {subs.map((sub, subIdx) => (
                    <div 
                      key={sub.id}
                      className="flex items-center gap-4 px-4 py-3 pl-10 hover:bg-gray-100/50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      
                      {/* Sub Image */}
                      <div className="w-12 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {sub.image_url ? (
                          <img src={sub.image_url} alt={sub.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Sub Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{sub.name}</span>
                          {!sub.is_active && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Скрыта</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">/{sub.slug}</p>
                      </div>

                      {/* Sub Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveCategory(sub.id, 'up')}
                          disabled={subIdx === 0}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveCategory(sub.id, 'down')}
                          disabled={subIdx === subs.length - 1}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActive(sub)}
                          className={cn(
                            "p-1.5 rounded transition-colors",
                            sub.is_active ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-200"
                          )}
                        >
                          {sub.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => startEdit(sub)}
                          className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCategory(sub)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет категорий</h3>
          <p className="text-gray-500 mb-6">Создайте первую категорию для каталога</p>
          <button
            onClick={() => startCreate()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Создать категорию
          </button>
        </div>
      )}
    </div>
  );
}
