import type { NextConfig } from "next";

const neonApiUrl = process.env.NEON_API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    if (!neonApiUrl) return [];

    return [
      {
        source: "/api/:path((?!auth(?:/|$)).*)",
        destination: `${neonApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
