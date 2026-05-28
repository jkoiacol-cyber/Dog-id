import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Si el usuario entra a '/' y NO viene ni 'slug' ni 'secret_id' -> Redirigir a /landing
      {
        source: '/',
        missing: [
          {
            type: 'query',
            key: 'slug',
          },
          {
            type: 'query',
            key: 'secret_id',
          },
        ],
        destination: '/landing',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;