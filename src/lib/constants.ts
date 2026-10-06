// Catálogos y reglas de negocio del CRM. Se mantienen como constantes de
// aplicación (no como enums de base de datos) para poder ajustarlos sin
// migraciones, igual que en el prototipo original (ver antiguo src/data.ts).

export const BRANDS = [
    'Audi', 'BMW', 'BMW Motorrad', 'CUPRA', 'Dongfeng', 'Foton', 'Geely',
    'Honda', 'Jetour', 'Kaiyi', 'Karry', 'Maxus', 'MG', 'MINI', 'SEAT',
    'Soueast', 'Toyota', 'Volkswagen', 'Volvo',
    'Foton Camiones', 'Iveco', 'MAN', 'VW Camiones',
    'Usados', 'Usados Premium',
] as const;

// Usados/Usados Premium no son una marca de fábrica sino el área de venta de
// vehículos usados — ahí se vende cualquier marca (incluso motos y camiones,
// no solo el catálogo de autos nuevos). Cuando el reclamo se marca con una de
// estas dos, el campo Modelo del formulario pasa a pedir "marca y modelo"
// libremente (ver ClaimForm.tsx) en vez de asumir que la marca ya quedó fija
// en el select. El valor de marca se mantiene igual para que el enrutamiento
// por marca (ver routing.ts) siga funcionando para el responsable de Usados.
export const USED_CAR_BRANDS = ['Usados', 'Usados Premium'] as const;

export function isUsedCarBrand(brand: string | null): boolean {
    return brand !== null && (USED_CAR_BRANDS as readonly string[]).includes(brand);
}

export const AREAS = ['Ventas', 'Servicio Técnico', 'Repuestos', 'Recursos Humanos'] as const;

export const BRANCHES = ['La Serena', 'Copiapó'] as const;

export const STATUSES = [
    { value: 'NUEVO', label: 'Nuevo' },
    { value: 'EN_REVISION', label: 'En Revisión' },
    { value: 'ESPERANDO_CLIENTE', label: 'Esperando Cliente' },
    { value: 'RESUELTO', label: 'Resuelto' },
    { value: 'CERRADO', label: 'Cerrado' },
] as const;

export type ClaimStatus = (typeof STATUSES)[number]['value'];

// Estados a partir de los cuales se considera que el reclamo ya no está "abierto".
export const CLOSED_STATUSES: ClaimStatus[] = ['RESUELTO', 'CERRADO'];

export const CHANNELS = [
    { value: 'WEB', label: 'Formulario Web' },
    { value: 'PHONE', label: 'Teléfono' },
    { value: 'IN_PERSON', label: 'Presencial' },
    { value: 'SOCIAL', label: 'Redes Sociales' },
    { value: 'EMAIL', label: 'Correo Electrónico' },
    { value: 'OTHER', label: 'Otro' },
] as const;

export type ClaimChannel = (typeof CHANNELS)[number]['value'];

export const RESOLUTION_TYPES = [
    { value: 'SE_ACOGE', label: 'Se acoge' },
    { value: 'NO_SE_ACOGE', label: 'No se acoge' },
    { value: 'PARCIAL', label: 'Se acoge parcial' },
    { value: 'OTRA_SOLUCION', label: 'Otra solución' },
] as const;

export type ResolutionType = (typeof RESOLUTION_TYPES)[number]['value'];

export const HISTORY_TYPES = [
    { value: 'NOTA', label: 'Nota' },
    { value: 'LLAMADA', label: 'Llamada' },
    { value: 'REUNION', label: 'Reunión' },
    { value: 'EMAIL', label: 'Correo Enviado' },
] as const;

// Listas planas de valores, útiles para validación (zod) y para iterar en UI.
export const AREA_VALUES = AREAS as unknown as [string, ...string[]];
export const BRAND_VALUES = BRANDS as unknown as [string, ...string[]];
export const BRANCH_VALUES = BRANCHES as unknown as [string, ...string[]];
export const STATUS_VALUES = STATUSES.map((s) => s.value) as [string, ...string[]];
export const CHANNEL_VALUES = CHANNELS.map((c) => c.value) as [string, ...string[]];
export const RESOLUTION_VALUES = RESOLUTION_TYPES.map((r) => r.value) as [string, ...string[]];
export const HISTORY_TYPE_VALUES = HISTORY_TYPES.map((h) => h.value) as [string, ...string[]];

// Tipos de historial generados por el propio sistema (no seleccionables por el usuario).
export const SYSTEM_HISTORY_TYPES = {
    CREACION: 'CREACION',
    CAMBIO_ESTADO: 'CAMBIO_ESTADO',
    ASIGNACION: 'ASIGNACION',
    ALERTA_ENVIADA: 'ALERTA_ENVIADA',
} as const;

export function statusLabel(value: string): string {
    return STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function channelLabel(value: string): string {
    return CHANNELS.find((c) => c.value === value)?.label ?? value;
}

export function resolutionLabel(value: string | null): string | null {
    if (!value) return null;
    return RESOLUTION_TYPES.find((r) => r.value === value)?.label ?? value;
}

export function historyTypeLabel(value: string): string {
    return HISTORY_TYPES.find((h) => h.value === value)?.label ?? value;
}

// Horas sin gestión antes de disparar la alerta automática por correo y de
// contar un reclamo como atrasado. Reloj corrido (no son horas hábiles).
export const DEFAULT_SLA_HOURS = 48;

/** Gerencia/Admin ve todos los reclamos; el resto solo los suyos (ver ClaimsList/notifications). */
export function isGerenciaRole(role: string): boolean {
    return role === 'Gerencia';
}
