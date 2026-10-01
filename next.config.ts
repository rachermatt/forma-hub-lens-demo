import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The synthetic query database is a Node built-in, never a persisted file.
  serverExternalPackages: ["node:sqlite"],
  outputFileTracingExcludes: { "*": ["./.env*", "./.git/**/*", "./.data/**/*", "./.vercel/**/*"] },
};

export default nextConfig;
