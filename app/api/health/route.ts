import { prisma } from '@/lib/prisma';

/** Endpoint de salud para monitoreo del servidor Cloudways / balanceador. */
export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return Response.json({ status: 'healthy' });
    } catch (err) {
        console.error('[health] fallo de conexión a la base de datos:', err);
        return Response.json({ status: 'unhealthy' }, { status: 503 });
    }
}
