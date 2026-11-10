import 'server-only';
import type { Prisma, User } from '@prisma/client';
import { STATUSES } from './constants';
import { claimScopeWhere, hasFullAccess } from './routing';

/**
 * Filtros de búsqueda compartidos entre el listado de reclamos, el Dashboard
 * y la exportación CSV (mismo filtro, varios destinos: ver tabla, ver
 * métricas, o descargar).
 */
export interface ClaimsFilterParams {
    q?: string;
    brand?: string;
    area?: string;
    status?: string;
    assignedToId?: string;
    from?: string;
    to?: string;
}

/**
 * Traduce la regla de acceso de canAccessClaim() (ver src/lib/routing.ts) a
 * un `where` de Prisma: el admin y el desarrollador ven todo; el resto ve lo
 * que tiene asignado, más cualquier reclamo dentro de su propio alcance de
 * marca/área/sucursal (ej. un gerente ve lo de las jefaturas que supervisa).
 */
function visibilityWhere(user: User): Prisma.ClaimWhereInput {
    if (hasFullAccess(user)) return {};
    return { OR: [{ assignedToId: user.id }, claimScopeWhere(user)] };
}

/** Arma el `where` de Prisma según el filtro y la visibilidad por rol/coincidencia (ver canAccessClaim). */
export function buildClaimsWhere(currentUser: User, { q, brand, area, status, assignedToId, from, to }: ClaimsFilterParams): Prisma.ClaimWhereInput {
    const conditions: Prisma.ClaimWhereInput[] = [visibilityWhere(currentUser)];

    if (brand) conditions.push({ brand });
    if (area) conditions.push({ area });
    if (status) conditions.push({ status });
    // El filtro por responsable solo lo puede usar quien ve todo (ver
    // ClaimsSearchBar) — para el resto su propia visibilidad ya viene acotada.
    if (assignedToId && hasFullAccess(currentUser)) conditions.push({ assignedToId: Number(assignedToId) });
    if (q) {
        // Busca por cualquiera de las columnas visibles en la tabla de
        // tickets (ID, cliente, vehículo/área, sucursal, estado,
        // responsable), no solo nombre/código. El estado se busca por su
        // etiqueta (ej. "en revisión"), no por el valor interno guardado.
        //
        // `mode: 'insensitive'` es soportado por PostgreSQL (motor por
        // defecto acá) pero no por MySQL — si se vuelve a MySQL/Cloudways
        // (ver prisma/schema.prisma), quitar esta opción; su collation por
        // defecto ya suele ser insensible a mayúsculas.
        const insensitiveContains = { contains: q, mode: 'insensitive' as const };
        const matchingStatuses = STATUSES.filter((s) => s.label.toLowerCase().includes(q.toLowerCase())).map((s) => s.value);

        conditions.push({
            OR: [
                { code: insensitiveContains },
                { customerName: insensitiveContains },
                { email: insensitiveContains },
                { phone: insensitiveContains },
                { rut: insensitiveContains },
                { brand: insensitiveContains },
                { vehicleModel: insensitiveContains },
                { plate: insensitiveContains },
                { area: insensitiveContains },
                { branch: insensitiveContains },
                { assignedTo: { name: insensitiveContains } },
                ...(matchingStatuses.length > 0 ? [{ status: { in: matchingStatuses } }] : []),
            ],
        });
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
    if (params.status) qs.set('status', params.status);
    if (params.assignedToId) qs.set('assignedToId', params.assignedToId);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    return qs.toString();
}
