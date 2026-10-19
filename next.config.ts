import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/admin/dashboard", destination: "/admin", permanent: false },
      { source: "/admin/content/practices", destination: "/admin/practices", permanent: false },
      { source: "/admin/content/practices/new", destination: "/admin/practices/new", permanent: false },
      { source: "/admin/content/practices/:id/edit", destination: "/admin/practices/:id/edit", permanent: false },
      { source: "/admin/content/programs", destination: "/admin/programs", permanent: false },
      { source: "/admin/content/programs/new", destination: "/admin/programs/new", permanent: false },
      { source: "/admin/content/programs/:id/edit", destination: "/admin/programs/:id/edit", permanent: false },
      { source: "/subscription", destination: "/subscription-terms", permanent: false },
    ];
  },
};

export default nextConfig;
