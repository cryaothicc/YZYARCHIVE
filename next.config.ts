import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // Handle .mp3 and other audio files as static asset URL strings
    config.module.rules.push({
      test: /\.(mp3|wav|ogg|flac|aac)$/i,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });

    // Treat SVG files imported from JS/TS as static asset URL strings
    // (the covers are used as <img src={...} />, not as React components)
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: RegExp }) => rule.test?.test?.(".svg"),
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });
    return config;
  },
};

export default nextConfig;
