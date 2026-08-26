// Configuración de Prisma 7 (reemplaza a `url` dentro de schema.prisma en
// versiones anteriores). La usan los comandos de CLI (migrate, studio,
// seed); la app en sí (src/lib/prisma.ts) sigue leyendo DATABASE_URL
// directamente vía el datasource generado.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
