import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libSQL ships native bindings for local file databases.
  serverExternalPackages: ["@libsql/client", "libsql"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
