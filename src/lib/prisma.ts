import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// Prisma 7 requiere pasar explícitamente un "driver adapter" — ya no basta
// con `url` en el datasource del schema. Este adapter es para Postgres/Neon
// (motor por defecto para desplegar en Vercel). Para autoalojar en
// Cloudways con MySQL/MariaDB en cambio: cambiar `provider` en
// prisma/schema.prisma a "mysql" y reemplazar este adapter por
// `PrismaMariaDb` de "@prisma/adapter-mariadb" — ver README.
//
// No se valida que DATABASE_URL exista antes de construir el adapter: este
// módulo se importa (y evalúa) durante `next build` — por ejemplo, la
// página estática /reclamo referencia la Server Action que importa este
// archivo — así que lanzar un error acá si falta la env var puede tumbar
// el build antes de que las variables de Vercel estén disponibles.
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

// Evita crear múltiples instancias de PrismaClient en desarrollo (hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
