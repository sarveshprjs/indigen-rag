import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  serverExternalPackages: ["pdf-parse", "@anthropic-ai/sdk", "openai"],
};
export default nextConfig;