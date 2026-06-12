import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  serverExternalPackages: ["pdf-parse"],
};
export default nextConfig;