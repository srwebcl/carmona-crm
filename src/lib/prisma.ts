import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Prisma 7 requiere pasar explícitamente un "driver adapter" — ya no basta
// con `url` en el datasource del schema. Este adapter es para MySQL/MariaDB
// (motor por defecto de Cloudways). Si la cuenta termina siendo Postgres,
// cambiar también `provider` en prisma/schema.prisma a "postgresql" y
// reemplazar este adapter por `PrismaPg` de "@prisma/adapter-pg".
function buildAdapter() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL no está definida.');
    return new PrismaMariaDb(url);
}

// Evita crear múltiples instancias de PrismaClient en desarrollo (hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: buildAdapter() });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
