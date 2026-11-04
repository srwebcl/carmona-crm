import 'server-only';
import type { Claim, User } from '@prisma/client';
import { prisma } from './prisma';

// Identidades con acceso total (ver todo, gestionar todo, reasignar,
// crear usuarios): el admin del negocio y el desarrollador. Se identifican
// por correo (no por rol, que es texto libre editable por cualquiera desde
// Equipo y Roles) para que no baste con escribir un cargo "parecido" para
// ganar accesos que no corresponden.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const DEVELOPER_EMAIL = (process.env.DEVELOPER_EMAIL || 'contacto@srweb.cl').toLowerCase();

export function isAdminUser(user: Pick<User, 'email'>): boolean {
    return Boolean(ADMIN_EMAIL) && user.email.toLowerCase() === ADMIN_EMAIL;
}

export function isGhostUser(user: Pick<User, 'email'>): boolean {
    return user.email.toLowerCase() === DEVELOPER_EMAIL;
}

/** Ve y gestiona cualquier reclamo, puede reasignar y crear usuarios. El resto son perfiles secundarios. */
export function hasFullAccess(user: Pick<User, 'email'>): boolean {
    return isAdminUser(user) || isGhostUser(user);
}

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
 * nuevo según marca + área + sucursal. El admin y el desarrollador quedan
 * fuera de la selección por calce (no se les asigna "porque su marca es
 * Todas") — el admin solo entra como respaldo final si nadie más calza.
 */
export async function autoAssignUser(brand: string | null, area: string, branch: string) {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    const candidates = users.filter((u) => !hasFullAccess(u));

    const match = candidates.find((u) => matchesClaim(u, { brand, area, branch }));
    if (match) return match;

    const admin = users.find((u) => isAdminUser(u));
    return admin ?? users[0] ?? null;
}

/**
 * Un reclamo solo lo ve y gestiona su asignado — salvo el admin y el
 * desarrollador, que ven y gestionan cualquiera sin restricción.
 */
export function canAccessClaim(user: User, claim: Pick<Claim, 'assignedToId'>): boolean {
    if (hasFullAccess(user)) return true;
    return claim.assignedToId === user.id;
}

/** Genera el código visible del reclamo a partir de su id autoincremental. */
export function buildClaimCode(id: number): string {
    return `REC-${1000 + id}`;
}
