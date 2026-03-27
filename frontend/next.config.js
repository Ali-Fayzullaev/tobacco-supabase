/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем ESLint при build чтобы избежать spawn ошибок с worker
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Отключаем webpack cache только при build (dev-серверу кэш нужен!)
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // ─── Security & SEO Headers ───
  async headers() {
    // Заголовки безопасности для ВСЕХ маршрутов
    const securityHeaders = [
      // Защита от clickjacking — запрещает встраивание в iframe
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      // Запрещает MIME-sniffing (предотвращает подмену Content-Type)
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // Принудительный HTTPS (2 года, включая поддомены)
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      // Контроль Referrer — отправляем origin только для cross-origin
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // Запрещает использование опасных API (камера, микрофон, геолокация)
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      // XSS-фильтр (для старых браузеров)
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      // Content Security Policy — контролирует источники контента
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://placehold.co",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join('; '),
      },
    ];

    return [
      // Глобальные security headers
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Отключаем индексацию каталога (законодательство о табаке)
      {
        source: '/catalog/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/product/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      // API-маршруты: запрещаем кеширование ответов с auth-данными
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
