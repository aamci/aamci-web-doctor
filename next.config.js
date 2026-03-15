/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: { typedRoutes: true },
  // NEXT_PUBLIC_API_BASE_URL is injected at build time via ARG in Dockerfile
  async rewrites() {
    // In dev (no NEXT_PUBLIC_API_BASE_URL), proxy /api/* → local API
    if (process.env.NEXT_PUBLIC_API_BASE_URL) return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*',
      },
    ];
  },
};
module.exports = nextConfig;