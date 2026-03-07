import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const apiMediaPattern = (() => {
  if (!apiUrl) {
    return null;
  }

  try {
    const url = new URL(apiUrl);
    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port,
      pathname: "/media/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "16.171.227.181",
        port: "",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "13.51.205.81",
        port: "",
        pathname: "/media/**",
      },
      ...(apiMediaPattern ? [apiMediaPattern] : []),
    ],
  },
  async rewrites() {
    if (!apiUrl) {
      return [];
    }

    return [
      {
        source: "/media/:path*",
        destination: `${apiUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
