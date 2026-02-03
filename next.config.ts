import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  // how to configure @svgr/webpack: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#configuring-webpack-loaders
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default withNextIntl(nextConfig);
