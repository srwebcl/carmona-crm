import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isGerenciaRole, CLOSED_STATUSES, DEFAULT_SLA_BUSINESS_DAYS } from '@/lib/constants';
import { businessDaysBetween } from '@/lib/businessDays';
import { Dashboard } from '@/components/Dashboard';

export default async function DashboardPage() {
    const currentUser = await requireUser();
    const scoped = isGerenciaRole(currentUser.role) ? {} : { assignedToId: currentUser.id };

    const claims = await prisma.claim.findMany({
        where: scoped,
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

    return <Dashboard total={total} abiertos={abiertos} resueltos={resueltos} vencidos={vencidos} topBrands={topBrands} topAreas={topAreas} />;
}
