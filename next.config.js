/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // <- add this
  experimental: { typedRoutes: true },
    env: {
    NEXT_PUBLIC_API_BASE_URL: 'https://api-ieis.onrender.com',
  },
};
module.exports = nextConfig;