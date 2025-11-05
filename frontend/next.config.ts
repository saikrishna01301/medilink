import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Disable strict mode in production if needed
  reactStrictMode: true,
  
  // ESLint configuration - don't fail build on warnings
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Only use if you really need to.
    ignoreDuringBuilds: false, // Keep false to catch errors, but warnings won't fail build
  },
  
  // Configure API rewrites (optional)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
