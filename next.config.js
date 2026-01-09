/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: { typedRoutes: true },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NODE_ENV === 'production'
      ? 'https://api-ieis.onrender.com'
      : '',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/:path*',
      },
    ];
  },
};
module.exports = nextConfig;