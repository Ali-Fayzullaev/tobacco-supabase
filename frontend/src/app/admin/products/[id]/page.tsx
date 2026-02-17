'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Loader2, 
  X,
  Plus
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { ImageUploader } from '@/components/admin/ImageUploader';
import type { Category } from '@/lib/types';

const productSchema = z.object({
  name: z.string().min(2, 'Введите название'),
  name_kk: z.string().optional(),
  slug: z.string().min(2, 'Введите URL'),
  description: z.string().optional(),
  description_kk: z.string().optional(),
  price: z.number().min(0, 'Цена должна быть положительной'),
  old_price: z.number().optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().min(1, 'Выберите категорию'),
  in_stock: z.boolean(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
});

type ProductForm = z.infer<typeof productSchema>;

interface Attribute {
  name: string;
  value: string;
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const isNew = productId === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      in_stock: true,
      is_active: true,
      is_featured: false,
    },
  });

  const name = watch('name');
  const [slugSuffix] = useState(() => Date.now().toString(36) + Math.random().toString(36).substring(2, 6));

  useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadProduct();
    }
  }, [productId]);

  // Auto-generate slug from name
  useEffect(() => {
    if (name && isNew) {
      // Генерируем slug из названия + уникальный суффикс (timestamp + random)
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50); // Ограничиваем длину
      
      setValue('slug', `${baseSlug}-${slugSuffix}`);
    }
  }, [name, isNew, setValue, slugSuffix]);

  const loadCategories = async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    setCategories(data || []);
  };

  const loadProduct = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          attributes:product_attributes(*)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (product) {
        setValue('name', product.name);
        setValue('name_kk', product.name_kk || '');
        setValue('slug', product.slug);
        setValue('description', product.description || '');
        setValue('description_kk', product.description_kk || '');
        setValue('price', product.price);
        setValue('old_price', product.old_price || undefined);
        setValue('sku', product.sku || '');
        setValue('brand', product.brand || '');
        setValue('category_id', product.category_id || '');
        setValue('in_stock', product.in_stock);
        setValue('is_active', product.is_active);
        setValue('is_featured', product.is_featured);
        // Загружаем изображения
        const imgs: string[] = [];
        if (product.image_url) imgs.push(product.image_url);
        setImages(imgs);
        setAttributes(product.attributes?.map((a: any) => ({ name: a.name, value: a.value })) || []);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Ошибка при загрузке товара');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    setIsSaving(true);
    try {
      const supabase = createBrowserSupabaseClient();

      const productData = {
        name: data.name,
        name_kk: data.name_kk || null,
        slug: data.slug,
        description: data.description || null,
        description_kk: data.description_kk || null,
        price: data.price,
        old_price: data.old_price || null,
        sku: data.sku || null,
        brand: data.brand || null,
        category_id: data.category_id,
        in_stock: data.in_stock,
        is_active: data.is_active,
        is_featured: data.is_featured,
        image_url: images[0] || null,
      };

      if (isNew) {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;

        // Save attributes
        if (attributes.length > 0 && newProduct) {
          const { error: attrError } = await supabase
            .from('product_attributes')
            .insert(
              attributes.map((attr, idx) => ({
                product_id: newProduct.id,
                name: attr.name,
                value: attr.value,
                sort_order: idx,
              }))
            );

          if (attrError) throw attrError;
        }

        toast.success('Товар создан');
        router.push('/admin/products');
      } else {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);

        if (error) throw error;

        // Update attributes: delete old and insert new
        await supabase
          .from('product_attributes')
          .delete()
          .eq('product_id', productId);

        if (attributes.length > 0) {
          const { error: attrError } = await supabase
            .from('product_attributes')
            .insert(
              attributes.map((attr, idx) => ({
                product_id: productId,
                name: attr.name,
                value: attr.value,
                sort_order: idx,
              }))
            );

          if (attrError) throw attrError;
        }

        toast.success('Товар обновлён');
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      // Понятные сообщения об ошибках
      if (error.code === '23505') {
        if (error.message?.includes('slug')) {
          toast.error('Товар с таким URL уже существует. Измените URL.');
        } else if (error.message?.includes('sku')) {
          toast.error('Товар с таким артикулом уже существует.');
        } else {
          toast.error('Товар с такими данными уже существует.');
        }
      } else {
        toast.error(error.message || 'Ошибка при сохранении');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { name: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Новый товар' : 'Редактирование товара'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название (RU) *
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название (KZ)
              </label>
              <input
                {...register('name_kk')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL (slug) *
              </label>
              <input
                {...register('slug')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категория *
              </label>
              <select
                {...register('category_id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Выберите категорию</option>
                {categories.filter(c => !c.parent_id).map((parent) => {
                  const subs = categories.filter(c => c.parent_id === parent.id);
                  return (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>{parent.name} (общее)</option>
                      {subs.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          &nbsp;&nbsp;{sub.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                {...register('sku')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Бренд
              </label>
              <input
                {...register('brand')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание (RU)
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание (KZ)
            </label>
            <textarea
              {...register('description_kk')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Цена и наличие</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цена (₸) *
              </label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Старая цена (₸)
              </label>
              <input
                {...register('old_price', { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-4">
            <label className="flex items-center gap-2">
              <input
                {...register('in_stock')}
                type="checkbox"
                className="w-4 h-4 text-gold-500 rounded"
              />
              <span className="text-gray-700">В наличии</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                {...register('is_active')}
                type="checkbox"
                className="w-4 h-4 text-gold-500 rounded"
              />
              <span className="text-gray-700">Активен</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                {...register('is_featured')}
                type="checkbox"
                className="w-4 h-4 text-gold-500 rounded"
              />
              <span className="text-gray-700">Рекомендуемый</span>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Изображения</h2>
          <ImageUploader
            images={images}
            onChange={setImages}
            maxImages={5}
          />
        </div>

        {/* Attributes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Характеристики</h2>
            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center gap-1 text-gold-600 hover:text-gold-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>

          <div className="space-y-3">
            {attributes.map((attr, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                  placeholder="Название"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  placeholder="Значение"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {attributes.length === 0 && (
              <p className="text-gray-500 text-sm">Характеристики не добавлены</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isNew ? 'Создать товар' : 'Сохранить изменения'}
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
