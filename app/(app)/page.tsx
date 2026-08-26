import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CLOSED_STATUSES, DEFAULT_SLA_BUSINESS_DAYS } from '@/lib/constants';
import { businessDaysBetween } from '@/lib/businessDays';
import { buildClaimsWhere, buildClaimsQueryString, type ClaimsFilterParams } from '@/lib/claimsFilter';
import { Dashboard } from '@/components/Dashboard';
import { ClaimsSearchBar } from '@/components/ClaimsSearchBar';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<ClaimsFilterParams> }) {
    const currentUser = await requireUser();
    const filters = await searchParams;
    const where = buildClaimsWhere(currentUser, filters);

    const claims = await prisma.claim.findMany({
        where,
        include: { history: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    const thresholdDays = Number(process.env.SLA_BUSINESS_DAYS ?? DEFAULT_SLA_BUSINESS_DAYS);
    const total = claims.length;
    const abiertos = claims.filter((c) => !CLOSED_STATUSES.includes(c.status as 'RESUELTO' | 'CERRADO')).length;
    const resueltos = total - abiertos;
    const vencidos = claims.filter((c) => {
        if (CLOSED_STATUSES.includes(c.status as 'RESUELTO' | 'CERRADO')) return false;
        const lastAction = c.history[0]?.createdAt ?? c.createdAt;
        return businessDaysBetween(lastAction, new Date()) >= thresholdDays;
    }).length;

    const byBrand = new Map<string, number>();
    const byArea = new Map<string, number>();
    for (const c of claims) {
        byBrand.set(c.brand, (byBrand.get(c.brand) ?? 0) + 1);
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
            topBrands={topBrands}
            topAreas={topAreas}
            exportHref={exportHref}
            isFiltered={isFiltered}
            searchBar={
                <Suspense fallback={null}>
                    <ClaimsSearchBar />
                </Suspense>
            }
        />
    );
}
