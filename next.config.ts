import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  serverExternalPackages: ["pdf-parse"],
};
export default nextConfig;
