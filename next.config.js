/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true
  },
  swcMinify: false,
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['firebase-admin', '@firebase/auth', '@firebase/app'],
  },
  webpack: (config, { isServer }) => {
    // Apply top-level await
    config.experiments = { ...config.experiments, topLevelAwait: true };
    
    // Fix potential hydration issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        perf_hooks: false,
      };
    }
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig; 