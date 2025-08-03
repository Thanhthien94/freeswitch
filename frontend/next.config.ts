import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',

  // Optimize for production
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react'],
  },

  // Image optimization
  images: {
    unoptimized: true, // For Docker deployment
  },



  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true, // Temporarily ignore for testing
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true, // Temporarily ignore for testing
  },
};

export default nextConfig;
