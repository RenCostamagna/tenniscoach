/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Web Workers
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    
    // Handle worker files with standard webpack support
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      type: 'javascript/auto',
    })

    // Ensure TypeScript workers are processed correctly
    config.resolve.extensions.push('.ts', '.tsx')

    return config
  },
  
  // Allow external domains for MediaPipe models
  images: {
    domains: ['storage.googleapis.com', 'cdn.jsdelivr.net'],
    unoptimized: true,
  },
  
  // Headers for SharedArrayBuffer (required for some MediaPipe features)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
