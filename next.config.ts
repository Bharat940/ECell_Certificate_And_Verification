import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly externalize these packages
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],

  // Add empty turbopack config to silence webpack warning
  turbopack: {},

  // Configure webpack to handle binary files
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add rule to handle .br files (Brotli compressed files)
      config.module.rules.push({
        test: /\.br$/,
        type: "asset/resource",
        generator: {
          filename: "static/chromium/[name][ext]",
        },
      });

      // Ensure chromium binaries are included
      config.resolve.alias = {
        ...config.resolve.alias,
        "@sparticuz/chromium": "@sparticuz/chromium",
      };
    }
    return config;
  },
};

export default nextConfig;
