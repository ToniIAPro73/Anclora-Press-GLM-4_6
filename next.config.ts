import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  // Increase external image and file size limits
  serverExternalPackages: ['pandoc-bin'],
  // Increase server action body size limit to 5MB (for large document uploads)
  serverActions: {
    bodySizeLimit: '5mb',
  },
};

export default nextConfig;
