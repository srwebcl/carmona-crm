import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { claimsToCsv } from '@/lib/csv';

/** Exporta la base de reclamos completa en CSV para armar estadísticas externas (requisito 12). */
export async function GET() {
    await requireUser();

    const claims = await prisma.claim.findMany({
        include: { assignedTo: true },
        orderBy: { createdAt: 'desc' },
    });

    const csv = claimsToCsv(claims);
    const filename = `reclamos-carmona-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
