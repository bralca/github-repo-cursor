import type { NextConfig } from "next";
import path from "path";

// Image optimization constants
const IMAGE_CACHE_TTL = 2678400; // 31 days in seconds

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly set trailingSlash to false to ensure consistent URL handling in all environments
  trailingSlash: false,
  
  images: {
    // Restrict formats to the most efficient one
    formats: ['image/webp'],
    
    // Set the minimum cache TTL to 31 days
    minimumCacheTTL: IMAGE_CACHE_TTL,
    
    // Configure common device sizes for responsive optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    
    // Optimize for common image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    
    // Remote patterns for allowed image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '**',
      },
    ],
    
    // Don't enlarge images beyond their original size
    dangerouslyAllowSVG: false,
    disableStaticImages: false,
  },
  // Ignore ESLint errors during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add webpack config to ensure proper path alias resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
};

export default nextConfig;
