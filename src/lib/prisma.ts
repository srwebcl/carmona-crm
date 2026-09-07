import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// El driver serverless de Neon usa WebSocket para transacciones; en
// runtime Node.js (self-hosted o funciones de Vercel, a diferencia del
// runtime "edge") hay que darle un constructor de WebSocket explícito, si
// no las transacciones fallan con "fetch failed" al abrir el socket.
neonConfig.webSocketConstructor = ws;

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
