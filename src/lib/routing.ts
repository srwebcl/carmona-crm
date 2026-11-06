import 'server-only';
import type { Claim, Prisma, User } from '@prisma/client';
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
export function matchesClaim(user: Pick<User, 'brands' | 'areas' | 'branches'>, claim: { brand: string | null; area: string; branch: string }): boolean {
    const brands = (user.brands as string[]) ?? [];
    const areas = (user.areas as string[]) ?? [];
    const branches = (user.branches as string[]) ?? [];

    const brandOk = brands.includes('Todas') || (claim.brand !== null && brands.includes(claim.brand));
    const areaOk = areas.includes('Todas') || areas.includes(claim.area);
    const branchOk = branches.includes('Todas') || branches.includes(claim.branch);

    return brandOk && areaOk && branchOk;
}

/** Traduce matchesClaim() a un `where` de Prisma, para filtrar reclamos en la base sin cargar todo a memoria (ver claimsFilter.ts). */
export function claimScopeWhere(user: Pick<User, 'brands' | 'areas' | 'branches'>): Prisma.ClaimWhereInput {
    const brands = (user.brands as string[]) ?? [];
    const areas = (user.areas as string[]) ?? [];
    const branches = (user.branches as string[]) ?? [];

    return {
        AND: [
            brands.includes('Todas') ? {} : { brand: { in: brands } },
            areas.includes('Todas') ? {} : { area: { in: areas } },
            branches.includes('Todas') ? {} : { branch: { in: branches } },
        ],
    };
}

/** Cuenta cuántos de los 3 campos (marca/área/sucursal) son específicos (no "Todas") — a mayor número, más puntual el cargo. */
function specificity(user: Pick<User, 'brands' | 'areas' | 'branches'>): number {
    const lists = [user.brands, user.areas, user.branches] as unknown as (string[] | null | undefined)[];
    return lists.filter((list) => !(list ?? []).includes('Todas')).length;
}

async function scopeCandidates(brand: string | null, area: string, branch: string) {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    const candidates = users.filter((u) => !hasFullAccess(u));
    const matches = candidates.filter((u) => matchesClaim(u, { brand, area, branch }));
    return { users, matches };
}

/**
 * Enrutamiento automático: elige al responsable principal de un reclamo
 * nuevo según marca + área + sucursal. El admin y el desarrollador quedan
 * fuera de la selección por calce (no se les asigna "porque su marca es
 * Todas") — el admin solo entra como respaldo final si nadie más calza.
 *
 * Cuando varios cargos calzan a la vez (ej. "Jefe Ventas Toyota" y "Gerente
 * Ventas" con marca "Todas"), queda como responsable el más específico, para
 * que un cargo amplio no le quite la propiedad a la jefatura puntual que
 * corresponde.
 */
export async function autoAssignUser(brand: string | null, area: string, branch: string) {
    const { users, matches } = await scopeCandidates(brand, area, branch);
    if (matches.length > 0) {
        return matches.reduce((best, u) => (specificity(u) > specificity(best) ? u : best));
    }

    const admin = users.find((u) => isAdminUser(u));
    return admin ?? users[0] ?? null;
}

/** Todos los perfiles cuyo alcance calza con el reclamo (incluye al que queda como responsable) — para avisarles aunque no sean el dueño formal (ver claimCreation.ts). */
export async function findMatchingUsers(brand: string | null, area: string, branch: string) {
    const { matches } = await scopeCandidates(brand, area, branch);
    return matches;
}

/**
 * Un reclamo lo ve y gestiona su asignado, o cualquier perfil cuyo alcance
 * (marca/área/sucursal) calce con el reclamo aunque no sea el dueño formal
 * (ej. un gerente que supervisa esa marca/área) — salvo el admin y el
 * desarrollador, que ven y gestionan cualquiera sin restricción.
 */
export function canAccessClaim(user: User, claim: Pick<Claim, 'assignedToId' | 'brand' | 'area' | 'branch'>): boolean {
    if (hasFullAccess(user)) return true;
    if (claim.assignedToId === user.id) return true;
    return matchesClaim(user, claim);
}

/** Genera el código visible del reclamo a partir de su id autoincremental. */
export function buildClaimCode(id: number): string {
    return `REC-${1000 + id}`;
}
