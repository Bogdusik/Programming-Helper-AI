import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // ESLint and TypeScript checks enabled for better code quality
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Note: swcMinify is enabled by default in Next.js 15+ and no longer needs to be specified
  
  // Compress responses in production
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    // Disable image optimization in development for faster builds
    unoptimized: process.env.NODE_ENV === 'development',
    // Enable image optimization in production
    remotePatterns: [],
  },
  
  // Optimize webpack cache to reduce warning about big strings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize cache for client-side builds
      config.cache = {
        ...config.cache,
        compression: 'gzip',
      }
    }
    return config
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.openai.com https://*.vercel-insights.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ],
      },
    ]
  },
};

export default nextConfig;
