import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:5234/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
