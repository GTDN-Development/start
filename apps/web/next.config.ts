import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    blog: {
      stale: 30,
      revalidate: 180,
    },
  },
  reactStrictMode: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/api/files/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/api/files/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
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
