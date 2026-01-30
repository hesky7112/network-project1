/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  reactStrictMode: false,
  // Add transpilePackages for ReactFlow and D3 stability
  transpilePackages: [
    'reactflow',
    '@reactflow/core',
    '@reactflow/background',
    '@reactflow/minimap',
    '@reactflow/controls',
    '@reactflow/node-resizer',
    '@reactflow/node-toolbar',
    'd3-color',
    'd3-dispatch',
    'd3-drag',
    'd3-ease',
    'd3-interpolate',
    'd3-selection',
    'd3-timer',
    'd3-transition',
    'd3-zoom'
  ],
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: false,
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // API rewrites for backend proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },

  // Bundle analyzer (only in analyze mode)
  ...(process.env.ANALYZE && {
    bundleAnalyzer: {
      enabled: true,
      openAnalyzer: true,
    },
  }),

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables validation
  env: {
    customKey: process.env.CUSTOM_KEY,
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Add bundle analyzer plugin when needed
    if (process.env.ANALYZE && !isServer) {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
    }

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
      }
    }

    return config
  },
}

module.exports = nextConfig
