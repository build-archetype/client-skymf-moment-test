/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "digitalhippo-production.up.railway.app",
      },
    ],
  },
  experimental: {
    esmExternals: "loose",
  },
};

module.exports = nextConfig;
