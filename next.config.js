/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: 'dist',
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" }
        ]
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: true // Temporarily ignore TS errors during build
  },
  experimental: {
    serverComponentsExternalPackages: ['openai', '@supabase/supabase-js']
  }
}

export default nextConfig 