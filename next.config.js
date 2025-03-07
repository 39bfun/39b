/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // API route configuration can be added here
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  // Environment variables configuration
  env: {
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  },
  // Output directory configuration
  distDir: 'build',
}

module.exports = nextConfig
