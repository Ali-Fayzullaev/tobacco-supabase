import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/catalog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/contacts`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return staticPages;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10000);

    if (error || !data) {
      return staticPages;
    }

    const productPages: MetadataRoute.Sitemap = data
      .filter((item) => Boolean(item.slug))
      .map((item) => ({
        url: `${siteUrl}/product/${encodeURIComponent(String(item.slug))}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
