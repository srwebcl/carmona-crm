import { z } from 'zod';
import { AREA_VALUES, BRAND_VALUES, BRANCH_VALUES, CHANNEL_VALUES, HISTORY_TYPE_VALUES, RESOLUTION_VALUES, STATUS_VALUES } from './constants';
import { isValidRut } from './rut';

// Campos mínimos del cliente/vehículo/caso exigidos por el negocio al
// ingresar un reclamo (punto 9 de los requisitos). brand/vehicleModel/plate
// son obligatorios salvo que se marque "noVehicle" (reclamos no asociados a
// un vehículo, ej. área Recursos Humanos) — ver applyVehicleRules más abajo.
const baseClaimFields = z.object({
    customerName: z.string().trim().min(2, 'Ingresa el nombre completo del cliente.'),
    rut: z.string().trim().refine(isValidRut, 'RUT inválido — revisa el dígito verificador.'),
    email: z.string().trim().email('Correo inválido.'),
    phone: z.string().trim().min(6, 'Ingresa un teléfono de contacto.'),
    noVehicle: z
        .string()
        .optional()
        .transform((v) => v === 'true'),
    brand: z.string().trim().optional(),
    vehicleModel: z.string().trim().optional(),
    plate: z.string().trim().optional(),
    eventDate: z.coerce.date({ error: 'Ingresa la fecha de compra o de visita al servicio técnico.' }),
    area: z.enum(AREA_VALUES),
    branch: z.enum(BRANCH_VALUES, { error: 'Selecciona la sucursal.' }),
    description: z.string().trim().min(10, 'Describe los hechos con más detalle.'),
    expectedSolution: z.string().trim().min(3, 'Indica la solución que esperas.'),
});

/** Agrega las reglas de "con/sin vehículo" a cualquier schema que extienda baseClaimFields. */
function applyVehicleRules<T extends typeof baseClaimFields>(schema: T) {
    return schema
        .refine((data) => data.noVehicle || BRAND_VALUES.includes(data.brand ?? ''), {
            message: 'Selecciona la marca del vehículo (o marca la casilla "sin vehículo").',
            path: ['brand'],
        })
        .refine((data) => data.noVehicle || Boolean(data.vehicleModel), {
            message: 'Ingresa el modelo del vehículo (o marca la casilla "sin vehículo").',
            path: ['vehicleModel'],
        })
        .refine((data) => data.noVehicle || Boolean(data.plate), {
            message: 'Ingresa la patente del vehículo (o marca la casilla "sin vehículo").',
            path: ['plate'],
        })
        .transform((data) => ({
            ...data,
            brand: data.noVehicle ? null : data.brand ?? null,
            vehicleModel: data.noVehicle ? null : data.vehicleModel ?? null,
            plate: data.noVehicle ? null : data.plate ?? null,
        }));
}

export const claimFieldsSchema = applyVehicleRules(baseClaimFields);

export const manualClaimSchema = applyVehicleRules(
    baseClaimFields.extend({ channel: z.enum(CHANNEL_VALUES) }),
);

export const historyEntrySchema = z.object({
    type: z.enum(HISTORY_TYPE_VALUES),
    text: z.string().trim().min(1, 'Escribe una nota o descripción de la gestión.'),
});

export const statusChangeSchema = z.object({
    status: z.enum(STATUS_VALUES),
    resolutionType: z.enum(RESOLUTION_VALUES).optional(),
    resolutionNotes: z.string().trim().optional(),
});

export const userSchema = z.object({
    name: z.string().trim().min(2, 'Ingresa el nombre completo.'),
    email: z.string().trim().email('Correo corporativo inválido.'),
    role: z.string().trim().min(2, 'Ingresa el cargo/rol.'),
    password: z.string().min(4, 'La contraseña o PIN debe tener al menos 4 caracteres.'),
    brands: z.array(z.string()).min(1, 'Selecciona al menos una marca.'),
    areas: z.array(z.string()).min(1, 'Selecciona al menos un área.'),
    branches: z.array(z.string()).min(1, 'Selecciona al menos una sucursal.'),
});

// Igual que userSchema, pero para editar un perfil existente: la
// contraseña/PIN es opcional — un valor vacío significa "no cambiarla".
export const updateUserSchema = userSchema.extend({
    password: z
        .string()
        .trim()
        .optional()
        .refine((v) => !v || v.length >= 4, 'La contraseña o PIN debe tener al menos 4 caracteres.'),
});

export const loginSchema = z.object({
    email: z.string().trim().email('Correo inválido.'),
    password: z.string().min(1, 'Ingresa tu contraseña o PIN.'),
});
