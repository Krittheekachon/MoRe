import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const localAddresses = Object.values(networkInterfaces()).flatMap((entries) =>
  (entries ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address),
);

const nextConfig: NextConfig = {
  // Public diagnostic ID only; no environment secrets are exported.
  env: process.env.NODE_ENV === "development" ? {
    NEXT_PUBLIC_NAV_DEBUG_BUILD_ID: `nav-debug-v1/dev-config-${new Date().toISOString()}`,
  } : {},
  distDir: process.env.MORE_DEMO_MODE === "1" ? ".next-demo" : ".next",
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", ...localAddresses],
};

export default nextConfig;
