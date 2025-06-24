/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Carbon101',
  assetPrefix: '/Carbon101/',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
};

module.exports = nextConfig;
