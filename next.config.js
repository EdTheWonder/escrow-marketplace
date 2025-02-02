/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'qzcrmwbdanlgwphuavnh.supabase.co',
      'res.cloudinary.com'
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
