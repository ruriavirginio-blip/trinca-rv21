import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "googleapis"],
  // Landing oficial: a raiz (protocolorv.com.br) serve a /nova.
  // Reversível: remover este rewrite restaura a landing antiga (src/app/page.tsx).
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/nova" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
