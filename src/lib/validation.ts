import { z } from 'zod';
import { AREA_VALUES, BRAND_VALUES, CHANNEL_VALUES, HISTORY_TYPE_VALUES, RESOLUTION_VALUES, STATUS_VALUES } from './constants';

// Campos mínimos del cliente/vehículo/caso exigidos por el negocio al
// ingresar un reclamo (punto 9 de los requisitos).
export const claimFieldsSchema = z.object({
    customerName: z.string().trim().min(2, 'Ingresa el nombre completo del cliente.'),
    email: z.string().trim().email('Correo inválido.'),
    phone: z.string().trim().min(6, 'Ingresa un teléfono de contacto.'),
    brand: z.enum(BRAND_VALUES),
    vehicleModel: z.string().trim().min(1, 'Ingresa el modelo del vehículo.'),
    plate: z.string().trim().min(1, 'Ingresa la patente del vehículo.'),
    eventDate: z.coerce.date({ error: 'Ingresa la fecha de compra o de visita al servicio técnico.' }),
    area: z.enum(AREA_VALUES),
    description: z.string().trim().min(10, 'Describe los hechos con más detalle.'),
    expectedSolution: z.string().trim().min(3, 'Indica la solución que esperas.'),
});

export const manualClaimSchema = claimFieldsSchema.extend({
    channel: z.enum(CHANNEL_VALUES),
});

export const historyEntrySchema = z.object({
    type: z.enum(HISTORY_TYPE_VALUES),
    text: z.string().trim().min(1, 'Escribe una nota o descripción de la gestión.'),
});

export const statusChangeSchema = z.object({
    status: z.enum(STATUS_VALUES),
    resolutionType: z.enum(RESOLUTION_VALUES).optional(),
});

export const userSchema = z.object({
    name: z.string().trim().min(2, 'Ingresa el nombre completo.'),
    email: z.string().trim().email('Correo corporativo inválido.'),
    role: z.string().trim().min(2, 'Ingresa el cargo/rol.'),
    password: z.string().min(4, 'La contraseña o PIN debe tener al menos 4 caracteres.'),
    brands: z.array(z.string()).min(1, 'Selecciona al menos una marca.'),
    areas: z.array(z.string()).min(1, 'Selecciona al menos un área.'),
});

export const loginSchema = z.object({
    email: z.string().trim().email('Correo inválido.'),
    password: z.string().min(1, 'Ingresa tu contraseña o PIN.'),
});
