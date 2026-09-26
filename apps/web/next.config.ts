import type { NextConfig } from "next";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    if (!apiOrigin) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
