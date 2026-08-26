import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { claimsToCsv } from '@/lib/csv';
import { buildClaimsWhere } from '@/lib/claimsFilter';

/**
 * Exporta reclamos en CSV para armar estadísticas externas (requisito 12).
 * Sin query params exporta todo (según lo que el usuario puede ver); con
 * `q`, `brand`, `from`/`to` exporta solo lo que calza con ese filtro —
 * mismo filtro que usa el listado de /reclamos y el panel del Dashboard.
 */
export async function GET(request: Request) {
    const currentUser = await requireUser();

    const { searchParams } = new URL(request.url);
    const where = buildClaimsWhere(currentUser, {
        q: searchParams.get('q') ?? undefined,
        brand: searchParams.get('brand') ?? undefined,
        from: searchParams.get('from') ?? undefined,
        to: searchParams.get('to') ?? undefined,
    });

    const claims = await prisma.claim.findMany({
        where,
        include: { assignedTo: true },
        orderBy: { createdAt: 'desc' },
    });

    const csv = claimsToCsv(claims);
    const filtered = [...searchParams.keys()].length > 0;
    const filename = `reclamos-carmona${filtered ? '-filtrado' : ''}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
