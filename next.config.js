/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['qzcrmwbdanlgwphuavnh.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qzcrmwbdanlgwphuavnh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
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
