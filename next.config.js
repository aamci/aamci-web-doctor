/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // <- add this
  experimental: { typedRoutes: true },
};
module.exports = nextConfig;