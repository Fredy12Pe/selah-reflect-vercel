/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.firebaseapp.com',
      },
    ],
  },
  // Enable Vercel's instrumentation for performance monitoring
  experimental: {
    instrumentationHook: true,
  }
};

module.exports = nextConfig; 