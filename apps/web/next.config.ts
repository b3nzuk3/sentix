import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@sentix/ui', '@sentix/types'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
