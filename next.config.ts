import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'slug',
            value: '(.*)',
          },
        ],
        destination: '/', // si hay slug, NO redirigimos
        permanent: false,
      },
      {
        source: '/',
        destination: '/landing',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
