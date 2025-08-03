import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Reduce logging in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-toast'],
  },
  
  // Enable bundle analyzer when ANALYZE=true
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer, dev }) => {
      if (!isServer) {
        // Exclude Prisma from client-side bundles
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        };
        
        config.externals.push({
          '@prisma/client': 'commonjs @prisma/client',
        });
      }
      
      // Reduce webpack logging in development
      if (dev) {
        config.stats = 'errors-warnings';
        config.infrastructureLogging = {
          level: 'error',
        };
      }
      
      // Bundle analyzer
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: isServer ? 8888 : 8889,
            openAnalyzer: true,
          })
        );
      }
      
      return config;
    },
  }) || {
    webpack: (config, { isServer, dev }) => {
      if (!isServer) {
        // Exclude Prisma from client-side bundles
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        };
        
        config.externals.push({
          '@prisma/client': 'commonjs @prisma/client',
        });
      }
      
      // Reduce webpack logging in development
      if (dev) {
        config.stats = 'errors-warnings';
        config.infrastructureLogging = {
          level: 'error',
        };
      }
      
      return config;
    },
  },

  // Enable static optimization
  output: 'standalone',
  
  // Handle uploads routing
  async rewrites() {
    return [
      {
        source: '/uploads/social/:path*',
        destination: '/api/uploads/social/:path*',
      },
    ];
  },
  
  // Optimize headers for caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
