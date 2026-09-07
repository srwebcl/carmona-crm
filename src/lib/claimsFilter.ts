import 'server-only';
import type { Prisma, User } from '@prisma/client';
import { isGerenciaRole } from './constants';

/**
 * Filtros de búsqueda compartidos entre el listado de reclamos y la
 * exportación CSV (mismo filtro, dos destinos: ver tabla o descargar).
 */
export interface ClaimsFilterParams {
    q?: string;
    brand?: string;
    from?: string;
    to?: string;
}

/** Arma el `where` de Prisma según el filtro y la visibilidad por rol (Gerencia ve todo, el resto solo lo suyo). */
export function buildClaimsWhere(currentUser: User, { q, brand, from, to }: ClaimsFilterParams): Prisma.ClaimWhereInput {
    return {
        ...(isGerenciaRole(currentUser.role) ? {} : { assignedToId: currentUser.id }),
        ...(brand ? { brand } : {}),
        // `mode: 'insensitive'` es soportado por PostgreSQL (motor por
        // defecto acá) pero no por MySQL — si se vuelve a MySQL/Cloudways
        // (ver prisma/schema.prisma), quitar esta opción; su collation por
        // defecto ya suele ser insensible a mayúsculas.
        ...(q ? { OR: [{ customerName: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }] } : {}),
        ...(from || to
            ? {
                createdAt: {
                    ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
                    ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
                },
            }
            : {}),
    };
}

/** Construye el query string (para el link de descarga) a partir del mismo filtro. */
export function buildClaimsQueryString(params: ClaimsFilterParams): string {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.brand) qs.set('brand', params.brand);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    return qs.toString();
}
