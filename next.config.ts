import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output: server autocontenido, ideal para desplegar en un
  // servidor propio (Cloudways) en lugar de la plataforma serverless de Vercel.
  output: 'standalone',
};

export default nextConfig;
