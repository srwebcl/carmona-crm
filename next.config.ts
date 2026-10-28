import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output: server autocontenido para autoalojar en un servidor
  // propio (Cloudways). En Vercel se omite — arma su propio output y no lo
  // necesita (`process.env.VERCEL` está siempre definido ahí en build time).
  output: process.env.VERCEL ? undefined : 'standalone',

  async headers() {
    return [
      {
        // Solo el formulario público de reclamos puede embeberse (vía
        // <iframe> en reclamos.automotrizcarmona.cl) — el resto del sistema
        // (panel interno) no debe ser embebible desde ningún sitio.
        source: '/reclamo/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://www.automotrizcarmona.cl https://automotrizcarmona.cl",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
