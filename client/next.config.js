/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Required for multi-stage Docker build
  output: 'standalone',
  // Allow primereact CSS to be imported
  transpilePackages: ['primereact'],
};

module.exports = nextConfig;
