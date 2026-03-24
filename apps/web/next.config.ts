import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@sentix/ui', '@sentix/types'],
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
