/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["your-image-domain.com"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/admin/:path*",
        destination: "/api/[...payload]",
      },
    ];
  },
  transpilePackages: ["payload"],
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /node_modules\/payload\/dist\/uploads\/getExternalFile\.js$/,
      use: "ignore-loader",
    });
    return config;
  },
};

module.exports = nextConfig;
