/** @type {import('next').NextConfig} */
const nextConfig = {
  // Conditionally set basePath only for production builds
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/Carbon101',
    assetPrefix: '/Carbon101/',
  }),
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix for Codespaces host header mismatch
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'orange-trout-69p96x7www67fx9p-3000.app.github.dev',
        '*.app.github.dev'
      ]
    }
  }
};

module.exports = nextConfig;