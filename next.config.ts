import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output: server autocontenido para autoalojar en un servidor
  // propio (Cloudways). En Vercel se omite — arma su propio output y no lo
  // necesita (`process.env.VERCEL` está siempre definido ahí en build time).
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;
