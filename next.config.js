/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
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
