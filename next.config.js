/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'qzcrmwbdanlgwphuavnh.supabase.co',
      'pub-2127bf698dab4e5c8767c9f3a15d08d6.r2.dev'
    ],
    unoptimized: true
  },
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

module.exports = nextConfig;
