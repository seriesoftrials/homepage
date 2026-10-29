import type { NextConfig } from "next";

// A preview build for GitHub Pages (seriesoftrials.github.io/homepage) is a
// static export served from a sub-path. Static export cannot use partial
// prerendering, so the Cache Components options are left out of that build;
// every page is static either way.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/homepage" : "";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  ...(pages
    ? { output: "export", basePath, trailingSlash: true }
    : { cacheComponents: true, partialPrefetching: true }),
  // Plain <img> paths in /public do not get the base path, so they read it here.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
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
