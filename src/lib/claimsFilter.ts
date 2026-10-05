import 'server-only';
import type { Prisma, User } from '@prisma/client';
import { isGerenciaRole } from './constants';

/**
 * Filtros de búsqueda compartidos entre el listado de reclamos, el Dashboard
 * y la exportación CSV (mismo filtro, varios destinos: ver tabla, ver
 * métricas, o descargar).
 */
export interface ClaimsFilterParams {
    q?: string;
    brand?: string;
    area?: string;
    assignedToId?: string;
    from?: string;
    to?: string;
}

/**
 * Traduce la regla de visibilidad cruzada de canAccessClaim() (ver
 * src/lib/routing.ts) a un `where` de Prisma: Gerencia ve todo; el resto ve
 * lo que tiene asignado MÁS cualquier reclamo cuya marca/área/sucursal
 * calce con lo que administra, aunque no sea el asignado (punto 11).
 */
function visibilityWhere(user: User): Prisma.ClaimWhereInput {
    if (isGerenciaRole(user.role)) return {};

    const brands = (user.brands as string[]) ?? [];
    const areas = (user.areas as string[]) ?? [];
    const branches = (user.branches as string[]) ?? [];

    const matchConditions: Prisma.ClaimWhereInput[] = [];
    if (!brands.includes('Todas')) matchConditions.push({ OR: [{ brand: null }, { brand: { in: brands } }] });
    if (!areas.includes('Todas')) matchConditions.push({ area: { in: areas } });
    if (!branches.includes('Todas')) matchConditions.push({ branch: { in: branches } });

    return {
        OR: [
            { assignedToId: user.id },
            matchConditions.length > 0 ? { AND: matchConditions } : {},
        ],
    };
}

/** Arma el `where` de Prisma según el filtro y la visibilidad por rol/coincidencia (ver canAccessClaim). */
export function buildClaimsWhere(currentUser: User, { q, brand, area, assignedToId, from, to }: ClaimsFilterParams): Prisma.ClaimWhereInput {
    const conditions: Prisma.ClaimWhereInput[] = [visibilityWhere(currentUser)];

    if (brand) conditions.push({ brand });
    if (area) conditions.push({ area });
    // El filtro por responsable solo lo puede usar Gerencia (ver
    // ClaimsSearchBar) — para el resto su propia visibilidad ya viene acotada.
    if (assignedToId && isGerenciaRole(currentUser.role)) conditions.push({ assignedToId: Number(assignedToId) });
    if (q) {
        // `mode: 'insensitive'` es soportado por PostgreSQL (motor por
        // defecto acá) pero no por MySQL — si se vuelve a MySQL/Cloudways
        // (ver prisma/schema.prisma), quitar esta opción; su collation por
        // defecto ya suele ser insensible a mayúsculas.
        conditions.push({ OR: [{ customerName: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }] });
    }
    if (from || to) {
        conditions.push({
            createdAt: {
                ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
        });
    }

    return { AND: conditions };
}

/** Construye el query string (para el link de descarga) a partir del mismo filtro. */
export function buildClaimsQueryString(params: ClaimsFilterParams): string {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.brand) qs.set('brand', params.brand);
    if (params.area) qs.set('area', params.area);
    if (params.assignedToId) qs.set('assignedToId', params.assignedToId);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    return qs.toString();
}
