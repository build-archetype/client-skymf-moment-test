/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["your-image-domain.com"],
  },
  async rewrites() {
    return [
      {
        source: "/admin/:path*",
        destination: "/api/[...payload]",
      },
    ];
  },
};

module.exports = nextConfig;
