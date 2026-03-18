import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: process.env.NODE_ENV === "development", // Solo offline en producción
  workboxOptions: {
    mode: "production",
  },
});

/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  serverExternalPackages: ['three'],
  // @ts-ignore
  turbopack: {},
};

export default withPWA(nextConfig);
