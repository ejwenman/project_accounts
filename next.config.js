/** @type {import('next').NextConfig} */
const nextConfig = {
/**  output: 'export', */ //commenting out on recocmendation of Claude.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
