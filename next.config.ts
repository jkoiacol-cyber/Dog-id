import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 1. Si viene slug, NO redirigir a /landing
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'slug',
          },
        ],
        destination: '/',
        permanent: false,
      },
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'secret_id',
          },
        ],
        destination: '/',
        permanent: false,
      },

      // 2. Si NO viene slug ni secret_id → redirigir a /landing
      {
        source: '/',
        destination: '/landing',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
