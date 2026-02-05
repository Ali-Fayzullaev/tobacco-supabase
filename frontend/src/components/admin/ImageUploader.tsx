'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Link as LinkIcon, X, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Ошибка загрузки');
    }

    return result.url;
  };

  const uploadUrl = async (url: string) => {
    const formData = new FormData();
    formData.append('url', url);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Ошибка загрузки');
    }

    return result.url;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Максимум ${maxImages} изображений`);
      return;
    }

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} не является изображением`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} слишком большой (макс. 10MB)`);
          continue;
        }

        const url = await uploadFile(file);
        newImages.push(url);
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
        toast.success(`Загружено ${newImages.length} фото`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    if (images.length >= maxImages) {
      toast.error(`Максимум ${maxImages} изображений`);
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadUrl(urlInput.trim());
      onChange([...images, url]);
      toast.success('Фото загружено');
      setUrlInput('');
      setShowUrlInput(false);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [removed] = newImages.splice(from, 1);
    newImages.splice(to, 0, removed);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Изображения ({images.length}/{maxImages})
      </label>

      {/* Сетка изображений */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {images.map((url, index) => (
          <div
            key={url}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group"
          >
            <Image
              src={url}
              alt={`Фото ${index + 1}`}
              fill
              className="object-cover"
            />
            
            {/* Overlay с действиями */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, index - 1)}
                  className="p-1 bg-white rounded text-gray-700 hover:bg-gray-100"
                  title="Переместить влево"
                >
                  ←
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="p-1 bg-red-500 rounded text-white hover:bg-red-600"
                title="Удалить"
              >
                <X className="w-4 h-4" />
              </button>
              {index < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, index + 1)}
                  className="p-1 bg-white rounded text-gray-700 hover:bg-gray-100"
                  title="Переместить вправо"
                >
                  →
                </button>
              )}
            </div>

            {/* Бейдж главного фото */}
            {index === 0 && (
              <div className="absolute top-1 left-1 bg-gold-500 text-white text-xs px-2 py-0.5 rounded">
                Главное
              </div>
            )}
          </div>
        ))}

        {/* Кнопка добавления */}
        {images.length < maxImages && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-gold-500 transition-colors">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer p-4 w-full h-full"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Загрузить</span>
                </label>
              </>
            )}
          </div>
        )}
      </div>

      {/* Кнопки загрузки */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || images.length >= maxImages}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          С компьютера
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={isUploading || images.length >= maxImages}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <LinkIcon className="w-4 h-4" />
          По ссылке
        </button>
      </div>

      {/* Поле ввода URL */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={isUploading || !urlInput.trim()}
            className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Загрузить'}
          </button>
          <button
            type="button"
            onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
            className="px-3 py-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Первое фото будет главным. Перетащите для изменения порядка. Макс. размер: 10MB.
      </p>
    </div>
  );
}
