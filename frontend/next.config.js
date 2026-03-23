/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем webpack cache для избежания OOM при сжатии
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  // Ограничиваем воркеры чтобы не падал из-за нехватки памяти при build
  experimental: {
    workerThreads: false,
    cpus: 1,
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
  // Отключаем индексацию для соблюдения законодательства о табаке
  async headers() {
    return [
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
    ];
  },
};

module.exports = nextConfig;
