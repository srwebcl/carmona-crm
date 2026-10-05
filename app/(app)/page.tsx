import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CLOSED_STATUSES, DEFAULT_SLA_HOURS, isGerenciaRole } from '@/lib/constants';
import { hoursBetween } from '@/lib/hours';
import { buildClaimsWhere, buildClaimsQueryString, type ClaimsFilterParams } from '@/lib/claimsFilter';
import { Dashboard } from '@/components/Dashboard';
import { ClaimsSearchBar } from '@/components/ClaimsSearchBar';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<ClaimsFilterParams> }) {
    const currentUser = await requireUser();
    const filters = await searchParams;
    const where = buildClaimsWhere(currentUser, filters);
    const showResponsable = isGerenciaRole(currentUser.role);

    const [claims, responsables] = await Promise.all([
        prisma.claim.findMany({
            where,
            include: { history: { orderBy: { createdAt: 'desc' }, take: 1 } },
        }),
        showResponsable ? prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }) : Promise.resolve([]),
    ]);

    const thresholdHours = Number(process.env.SLA_HOURS ?? DEFAULT_SLA_HOURS);
    const total = claims.length;
    const abiertos = claims.filter((c) => !CLOSED_STATUSES.includes(c.status as 'RESUELTO' | 'CERRADO')).length;
    const resueltos = total - abiertos;
    const vencidos = claims.filter((c) => {
        if (CLOSED_STATUSES.includes(c.status as 'RESUELTO' | 'CERRADO')) return false;
        const lastAction = c.history[0]?.createdAt ?? c.createdAt;
        return hoursBetween(lastAction, new Date()) >= thresholdHours;
    }).length;

    const byBrand = new Map<string, number>();
    const byArea = new Map<string, number>();
    for (const c of claims) {
        // Reclamos sin vehículo (ej. RRHH) no tienen marca — se excluyen del
        // desglose por marca en vez de aparecer como un bucket "null".
        if (c.brand) byBrand.set(c.brand, (byBrand.get(c.brand) ?? 0) + 1);
        byArea.set(c.area, (byArea.get(c.area) ?? 0) + 1);
    }
    const topBrands = [...byBrand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topAreas = [...byArea.entries()].sort((a, b) => b[1] - a[1]);

    const qs = buildClaimsQueryString(filters);
    const isFiltered = qs.length > 0;
    const exportHref = `/api/export/claims${isFiltered ? `?${qs}` : ''}`;

    return (
        <Dashboard
            total={total}
            abiertos={abiertos}
            resueltos={resueltos}
            vencidos={vencidos}
            thresholdHours={thresholdHours}
            topBrands={topBrands}
            topAreas={topAreas}
            exportHref={exportHref}
            isFiltered={isFiltered}
            searchBar={
                <Suspense fallback={null}>
                    <ClaimsSearchBar responsables={responsables} showResponsable={showResponsable} />
                </Suspense>
            }
        />
    );
}
