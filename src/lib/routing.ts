import 'server-only';
import { prisma } from './prisma';

/**
 * Enrutamiento automático: elige al responsable de un reclamo nuevo según
 * marca + área, igual que la regla del prototipo original (routeClaim en
 * SimulationForm.tsx). "Todas" en brands/areas significa que ese usuario
 * cubre cualquier marca/área. Si nadie calza, cae al primer usuario
 * registrado (Admin/Gerencia) como responsable por defecto.
 */
export async function autoAssignUser(brand: string, area: string) {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });

    const match = users.find((u) => {
        const brands = (u.brands as string[]) ?? [];
        const areas = (u.areas as string[]) ?? [];
        const brandOk = brands.includes('Todas') || brands.includes(brand);
        const areaOk = areas.includes('Todas') || areas.includes(area);
        return u.role !== 'Gerencia' && brandOk && areaOk;
    });

    return match ?? users[0] ?? null;
}

/** Genera el código visible del reclamo a partir de su id autoincremental. */
export function buildClaimCode(id: number): string {
    return `REC-${1000 + id}`;
}
