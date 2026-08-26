import 'server-only';
import { stringify } from 'csv-stringify/sync';
import { statusLabel, channelLabel, resolutionLabel } from './constants';
import type { Claim, User } from '@prisma/client';

export function claimsToCsv(claims: (Claim & { assignedTo: User })[]): string {
    const rows = claims.map((c) => ({
        Codigo: c.code,
        Cliente: c.customerName,
        Correo: c.email,
        Telefono: c.phone,
        Marca: c.brand,
        Modelo: c.vehicleModel,
        Patente: c.plate,
        'Fecha Compra/Visita': c.eventDate.toISOString().slice(0, 10),
        Area: c.area,
        Canal: channelLabel(c.channel),
        Estado: statusLabel(c.status),
        Resolucion: resolutionLabel(c.resolutionType) ?? '',
        Responsable: c.assignedTo.name,
        Descripcion: c.description,
        'Solucion Esperada': c.expectedSolution,
        'Fecha Ingreso': c.createdAt.toISOString(),
        'Fecha Cierre': c.closedAt ? c.closedAt.toISOString() : '',
    }));

    return stringify(rows, { header: true });
}
