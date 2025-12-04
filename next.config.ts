import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (apiUrl) {
  try {
    const parsed = new URL(apiUrl);
    remotePatterns.push({
      protocol: (parsed.protocol.replace(":", "") as "http" | "https") || "http",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: "/**",
    });
  } catch (error) {
    console.warn("Invalid NEXT_PUBLIC_API_URL for image config:", apiUrl, error);
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
