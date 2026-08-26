import { Suspense } from 'react';
import type { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isGerenciaRole } from '@/lib/constants';
import { ClaimsSearchBar } from '@/components/ClaimsSearchBar';
import { ClaimsTable } from '@/components/ClaimsTable';

interface SearchParams {
    q?: string;
    brand?: string;
    from?: string;
    to?: string;
}

export default async function ReclamosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const currentUser = await requireUser();
    const { q, brand, from, to } = await searchParams;

    const where: Prisma.ClaimWhereInput = {
        ...(isGerenciaRole(currentUser.role) ? {} : { assignedToId: currentUser.id }),
        ...(brand ? { brand } : {}),
        ...(q ? { OR: [{ customerName: { contains: q } }, { code: { contains: q } }] } : {}),
        ...(from || to
            ? {
                createdAt: {
                    ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
                    ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
                },
            }
            : {}),
    };

    const claims = await prisma.claim.findMany({
        where,
        include: { assignedTo: true, history: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
    });

    const rows = claims.map((c) => ({ ...c, lastActionAt: c.history[0]?.createdAt ?? c.createdAt }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800">
                        {isGerenciaRole(currentUser.role) ? 'Todos los Tickets' : 'Mis Tickets Asignados'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestiona y da seguimiento a los casos de clientes.</p>
                </div>
                <Suspense fallback={null}>
                    <ClaimsSearchBar />
                </Suspense>
            </div>

            <ClaimsTable claims={rows} />
        </div>
    );
}
