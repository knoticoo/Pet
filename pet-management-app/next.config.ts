import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce logging in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Experimental features to reduce verbose output
  experimental: {
    logging: {
      level: 'error', // Only show errors, not CSS loading messages
    },
  },
  
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
};

export default nextConfig;
