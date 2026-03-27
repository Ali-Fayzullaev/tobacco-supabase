import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v2 as cloudinary } from 'cloudinary';
import { uploadLimiter, getClientIP } from '@/lib/rate-limit';

// ─── Ограничения загрузки ───
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin' ? user : null;
}

export async function POST(request: NextRequest) {
  try {
    // ─── Rate Limiting: 20 загрузок / 5 мин ───
    const clientIP = getClientIP(request);
    const rl = uploadLimiter.check(clientIP);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Слишком много загрузок. Повторите через ${Math.ceil(rl.retryAfterMs / 1000)} сек.` },
        { status: 429, headers: rl.headers }
      );
    }

    const admin = await getAuthUser();
    if (!admin) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    let result;

    if (file) {
      // ─── Валидация файла: размер и тип ───
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Файл слишком большой. Максимум ${MAX_FILE_SIZE / 1024 / 1024} MB` },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF` },
          { status: 400 }
        );
      }

      // Загрузка файла с компьютера
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'tobacco-shop',
            resource_type: 'image',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
    } else if (url) {
      // ─── SSRF Protection: проверяем URL ───
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
          return NextResponse.json(
            { error: 'Разрешены только HTTPS-ссылки' },
            { status: 400 }
          );
        }
        // Блокируем приватные IP (SSRF)
        const hostname = parsed.hostname;
        const blocked = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.|\[::1\]|\[fc|\[fd)/i;
        if (blocked.test(hostname)) {
          return NextResponse.json(
            { error: 'Недопустимый URL' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Некорректный URL' },
          { status: 400 }
        );
      }

      // Загрузка по URL
      result = await cloudinary.uploader.upload(url, {
        folder: 'tobacco-shop',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
    } else {
      return NextResponse.json(
        { error: 'Нужен файл или URL' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      public_id: (result as any).public_id,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка загрузки' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAuthUser();
    if (!admin) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const { public_id } = await request.json();
    
    if (!public_id) {
      return NextResponse.json(
        { error: 'Нужен public_id' },
        { status: 400 }
      );
    }

    await cloudinary.uploader.destroy(public_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка удаления' },
      { status: 500 }
    );
  }
}
