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
