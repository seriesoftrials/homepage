import type { NextConfig } from "next";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  // Preserve the original landing document and its native scroll behavior.
  rewrites() {
    const assets = readdirSync(resolve(process.cwd(), "grainy/public"), {
      withFileTypes: true,
    }).map((entry) => {
      const suffix = entry.isDirectory() ? "/:path*" : "";
      return {
        source: `/${entry.name}${suffix}`,
        destination: `/grainy/${entry.name}${suffix}`,
      };
    });
    return {
      beforeFiles: [
        ...["/", "/index.html", "/ver2"].map((source) => ({
          source,
          destination: "/grainy/index.html",
        })),
        { source: "/intro", destination: "/grainy/intro.html" },
        { source: "/ver2-hero.js", destination: "/grainy/ver2-hero.js" },
        ...assets,
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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
