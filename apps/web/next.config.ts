import type { NextConfig } from "next";
import path from "path";

const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  ...(isVercel ? {} : {
    turbopack: {
      // next is hoisted to monorepo root node_modules by npm workspaces
      root: path.join(__dirname, "../.."),
    },
  }),
};

export default nextConfig;
