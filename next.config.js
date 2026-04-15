/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  typescript: {
    // Disable during development, enable in CI
    tsconfigPath: './tsconfig.json'
  },
  eslint: {
    // Disable during development, enable in CI
    ignoreDuringBuilds: false
  }
};

module.exports = nextConfig;
