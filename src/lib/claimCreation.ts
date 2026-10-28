import 'server-only';
import { randomUUID } from 'node:crypto';
import { prisma } from './prisma';
import { autoAssignUser, buildClaimCode } from './routing';
import { saveUploadedFiles } from './uploads';
import { sendMail, newClaimNotificationEmail } from './mailer';
import { SYSTEM_HISTORY_TYPES } from './constants';

/**
 * Crea un reclamo y su bitácora inicial (creación + asignación automática).
 * Usado tanto por los Server Actions del formulario interno (src/actions/claims.ts)
 * como por el endpoint público para integraciones externas (app/api/public/claims).
 */
export async function createClaim(data: {
    customerName: string; rut: string; email: string; phone: string;
    brand: string | null; vehicleModel: string | null; plate: string | null;
    eventDate: Date; area: string; branch: string; description: string; expectedSolution: string;
    channel: string; createdByName: string;
}) {
    const assignedTo = await autoAssignUser(data.brand, data.area, data.branch);
    if (!assignedTo) throw new Error('No hay usuarios registrados para asignar el reclamo. Crea al menos un perfil en Equipo y Roles.');

    const claim = await prisma.claim.create({
        data: {
            // Placeholder único (evita choques de concurrencia con la
            // restricción @unique): el código real se deriva del id recién
            // generado y se actualiza justo abajo, ya que buildClaimCode
            // necesita el id, que solo existe después del insert.
            code: `TEMP-${randomUUID()}`,
            customerName: data.customerName,
            rut: data.rut,
            email: data.email,
            phone: data.phone,
            brand: data.brand,
            vehicleModel: data.vehicleModel,
            plate: data.plate,
            eventDate: data.eventDate,
            area: data.area,
            branch: data.branch,
            description: data.description,
            expectedSolution: data.expectedSolution,
            channel: data.channel,
            status: 'NUEVO',
            assignedToId: assignedTo.id,
        },
    });

    // El código se deriva del id autoincremental una vez creado el registro.
    const code = buildClaimCode(claim.id);
    await prisma.claim.update({ where: { id: claim.id }, data: { code } });

    await prisma.claimHistory.createMany({
        data: [
            {
                claimId: claim.id,
                userId: null,
                authorName: 'Sistema',
                type: SYSTEM_HISTORY_TYPES.CREACION,
                text: `Reclamo ingresado por ${data.createdByName}.`,
            },
            {
                claimId: claim.id,
                userId: null,
                authorName: 'Sistema',
                type: SYSTEM_HISTORY_TYPES.ASIGNACION,
                text: `Enrutado automáticamente a: ${assignedTo.name}.`,
            },
        ],
    });

    // Aviso al admin principal y al responsable asignado — en un Set para no
    // duplicar el envío cuando ambos son la misma persona (ej. el admin se
    // auto-asigna porque nadie más calza con la marca/área/sucursal).
    const recipients = new Set<string>();
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) recipients.add(adminEmail);
    recipients.add(assignedTo.email);

    try {
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const email = newClaimNotificationEmail({
            code,
            customerName: data.customerName,
            area: data.area,
            brand: data.brand,
            vehicleModel: data.vehicleModel,
            description: data.description,
            assignedToName: assignedTo.name,
            url: `${appUrl}/reclamos/${claim.id}`,
        });
        await sendMail({ to: [...recipients], subject: email.subject, html: email.html });
    } catch (err) {
        // Un correo que falla no debe hacer fallar la creación del reclamo,
        // que ya quedó guardada arriba.
        console.error(`[createClaim] no se pudo enviar la notificación de nuevo reclamo para ${code}:`, err);
    }

    return { ...claim, code };
}

export async function attachFiles(files: File[], claimId: number, uploadedByName: string) {
    if (files.length === 0) return;
    const saved = await saveUploadedFiles(files, claimId);
    if (saved.length === 0) return;
    await prisma.attachment.createMany({
        data: saved.map((f) => ({ claimId, filename: f.filename, path: f.path, size: f.size, mimeType: f.mimeType, uploadedByName })),
    });
}
