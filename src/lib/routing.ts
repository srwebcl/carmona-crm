import 'server-only';
import type { Claim, User } from '@prisma/client';
import { prisma } from './prisma';
import { isGerenciaRole } from './constants';

/**
 * Compara las marcas/áreas/sucursales que administra un usuario contra los
 * datos de un reclamo. "Todas" en cualquiera de las listas del usuario
 * significa que no restringe por ese criterio.
 *
 * Un reclamo sin marca (ej. área Recursos Humanos, sin vehículo asociado)
 * solo califica como marca "Todas" para usuarios que también administran
 * "Todas" las marcas — un perfil restringido a una marca puntual (ej. un
 * "Gerente Toyota" con brands: ["Toyota"]) no debe terminar gestionando
 * reclamos sin marca solo porque sus áreas/sucursales son "Todas".
 */
function matchesClaim(user: Pick<User, 'brands' | 'areas' | 'branches'>, claim: { brand: string | null; area: string; branch: string }): boolean {
    const brands = (user.brands as string[]) ?? [];
    const areas = (user.areas as string[]) ?? [];
    const branches = (user.branches as string[]) ?? [];

    const brandOk = brands.includes('Todas') || (claim.brand !== null && brands.includes(claim.brand));
    const areaOk = areas.includes('Todas') || areas.includes(claim.area);
    const branchOk = branches.includes('Todas') || branches.includes(claim.branch);

    return brandOk && areaOk && branchOk;
}

/**
 * Enrutamiento automático: elige al responsable principal de un reclamo
 * nuevo según marca + área + sucursal. Gerencia queda fuera de la selección
 * automática (ve todo igual, pero no se le asignan reclamos uno a uno). Si
 * nadie calza, cae al primer usuario registrado como responsable por defecto.
 */
export async function autoAssignUser(brand: string | null, area: string, branch: string) {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });

    const match = users.find((u) => u.role !== 'Gerencia' && matchesClaim(u, { brand, area, branch }));

    return match ?? users[0] ?? null;
}

/**
 * Visibilidad/gestión cruzada (punto 11): un reclamo no es solo para su
 * asignado — cualquier perfil cuyas marcas/áreas/sucursales calcen también
 * puede verlo y gestionarlo desde su panel, igual que el que auto-asigna.
 * Gerencia ve y gestiona todo sin restricción.
 */
export function canAccessClaim(user: User, claim: Pick<Claim, 'assignedToId' | 'brand' | 'area' | 'branch'>): boolean {
    if (isGerenciaRole(user.role)) return true;
    if (claim.assignedToId === user.id) return true;
    return matchesClaim(user, claim);
}

/** Genera el código visible del reclamo a partir de su id autoincremental. */
export function buildClaimCode(id: number): string {
    return `REC-${1000 + id}`;
}
