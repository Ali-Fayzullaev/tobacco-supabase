import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/catalog', '/product/'],
        disallow: [
          '/admin',
          '/profile',
          '/cart',
          '/checkout',
          '/login',
          '/register',
          '/debug-auth',
          '/auth/',
          '/verify-email',
          '/order-success',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
