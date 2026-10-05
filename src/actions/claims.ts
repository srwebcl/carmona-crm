'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { autoAssignUser, buildClaimCode, canAccessClaim } from '@/lib/routing';
import { saveUploadedFiles, collectFiles } from '@/lib/uploads';
import { claimFieldsSchema, manualClaimSchema, historyEntrySchema, statusChangeSchema } from '@/lib/validation';
import { sendMail, resolutionEmail } from '@/lib/mailer';
import { resolutionLabel, CLOSED_STATUSES, SYSTEM_HISTORY_TYPES } from '@/lib/constants';

export interface ClaimFormState {
    error?: string;
    success?: string;
}

const NO_ACCESS_ERROR = 'No tienes acceso a este reclamo.';

/**
 * Ingreso público de un reclamo (sin sesión) — es la página que Carmona
 * puede enlazar/embeber desde su sitio web (requisito 2).
 */
export async function createClaimFromPublicForm(_prevState: ClaimFormState, formData: FormData): Promise<ClaimFormState> {
    const parsed = claimFieldsSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }

    const createdByName = 'Cliente (formulario web)';
    const claim = await createClaim({ ...parsed.data, channel: 'WEB', createdByName });

    const files = collectFiles(formData, 'attachments');
    await attachFiles(files, claim.id, createdByName);

    redirect(`/reclamo/confirmacion?code=${claim.code}`);
}

/** Ingreso manual por un administrador/jefatura, para reclamos recibidos por otro canal (requisito 3). */
export async function createClaimManual(_prevState: ClaimFormState, formData: FormData): Promise<ClaimFormState> {
    const currentUser = await requireUser();

    const parsed = manualClaimSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }

    const { channel, ...fields } = parsed.data;
    const claim = await createClaim({ ...fields, channel, createdByName: currentUser.name });

    const files = collectFiles(formData, 'attachments');
    await attachFiles(files, claim.id, currentUser.name);

    revalidatePath('/reclamos');
    redirect(`/reclamos/${claim.id}`);
}

async function createClaim(data: {
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

    return { ...claim, code };
}

async function attachFiles(files: File[], claimId: number, uploadedByName: string) {
    if (files.length === 0) return;
    const saved = await saveUploadedFiles(files, claimId);
    if (saved.length === 0) return;
    await prisma.attachment.createMany({
        data: saved.map((f) => ({ claimId, filename: f.filename, path: f.path, size: f.size, mimeType: f.mimeType, uploadedByName })),
    });
}

/** Trae lo mínimo del reclamo para chequear visibilidad (punto 11) antes de dejar gestionarlo. */
async function requireClaimAccess(claimId: number, currentUser: Awaited<ReturnType<typeof requireUser>>) {
    const claim = await prisma.claim.findUniqueOrThrow({ where: { id: claimId } });
    if (!canAccessClaim(currentUser, claim)) return null;
    return claim;
}

/** Registra una gestión (nota, llamada, reunión, email) en la bitácora del reclamo (requisito 6). */
export async function addHistoryEntry(claimId: number, _prevState: ClaimFormState, formData: FormData): Promise<ClaimFormState> {
    const currentUser = await requireUser();
    const claim = await requireClaimAccess(claimId, currentUser);
    if (!claim) return { error: NO_ACCESS_ERROR };

    const parsed = historyEntrySchema.safeParse({ type: formData.get('type'), text: formData.get('text') });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }

    const history = await prisma.claimHistory.create({
        data: {
            claimId,
            userId: currentUser.id,
            authorName: currentUser.name,
            type: parsed.data.type,
            text: parsed.data.text,
        },
    });

    const files = collectFiles(formData, 'attachments');
    if (files.length > 0) {
        const saved = await saveUploadedFiles(files, claimId);
        await prisma.attachment.createMany({
            data: saved.map((f) => ({ claimId, historyId: history.id, filename: f.filename, path: f.path, size: f.size, mimeType: f.mimeType, uploadedByName: currentUser.name })),
        });
    }

    revalidatePath(`/reclamos/${claimId}`);
    return { success: 'Gestión registrada.' };
}

/** Cambia el estado del reclamo; exige clasificación + solución definitiva al resolver/cerrar (requisitos 8 y 10). */
export async function changeClaimStatus(claimId: number, _prevState: ClaimFormState, formData: FormData): Promise<ClaimFormState> {
    const currentUser = await requireUser();
    const claim = await requireClaimAccess(claimId, currentUser);
    if (!claim) return { error: NO_ACCESS_ERROR };

    const parsed = statusChangeSchema.safeParse({
        status: formData.get('status'),
        resolutionType: formData.get('resolutionType') || undefined,
        resolutionNotes: formData.get('resolutionNotes') || undefined,
    });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Estado inválido.' };
    }

    const { status, resolutionType, resolutionNotes } = parsed.data;
    const isClosing = CLOSED_STATUSES.includes(status as 'RESUELTO' | 'CERRADO');
    if (isClosing && !resolutionType) {
        return { error: 'Selecciona la clasificación de la respuesta final antes de marcar el reclamo como resuelto/cerrado.' };
    }
    // La solución definitiva se exige la primera vez que se resuelve/cierra;
    // si ya quedó registrada antes, no hace falta volver a pedirla.
    if (isClosing && !resolutionNotes && !claim.resolutionNotes) {
        return { error: 'Describe la solución definitiva del caso antes de marcar el reclamo como resuelto/cerrado.' };
    }

    await prisma.claim.update({
        where: { id: claimId },
        data: {
            status,
            resolutionType: resolutionType ?? claim.resolutionType,
            resolutionNotes: resolutionNotes ?? claim.resolutionNotes,
            closedAt: status === 'CERRADO' ? new Date() : claim.closedAt,
        },
    });

    await prisma.claimHistory.create({
        data: {
            claimId,
            userId: currentUser.id,
            authorName: currentUser.name,
            type: SYSTEM_HISTORY_TYPES.CAMBIO_ESTADO,
            text: `Estado cambiado de "${claim.status}" a "${status}"`
                + (resolutionType ? ` — Clasificación: ${resolutionLabel(resolutionType)}` : '')
                + (resolutionNotes ? `\nSolución definitiva: ${resolutionNotes}` : ''),
        },
    });

    if (status === 'RESUELTO' && resolutionType) {
        // El envío de correo no debe hacer fallar el cambio de estado (que
        // ya quedó guardado arriba) si el SMTP está mal configurado o no
        // responde — solo se deja registro del error.
        try {
            const email = resolutionEmail({ code: claim.code, customerName: claim.customerName, resolutionLabel: resolutionLabel(resolutionType) ?? resolutionType });
            await sendMail({ to: claim.email, subject: email.subject, html: email.html });
        } catch (err) {
            console.error(`[changeClaimStatus] no se pudo enviar el correo de resolución para ${claim.code}:`, err);
        }
    }

    revalidatePath(`/reclamos/${claimId}`);
    revalidatePath('/reclamos');
    return { success: 'Estado actualizado.' };
}

/** Reasignación manual del reclamo a otra jefatura/responsable (requisito 5). */
export async function reassignClaim(claimId: number, formData: FormData) {
    const currentUser = await requireUser();
    const claim = await requireClaimAccess(claimId, currentUser);
    if (!claim) return;

    const newAssigneeId = Number(formData.get('assignedToId'));
    if (!newAssigneeId) return;

    const newAssignee = await prisma.user.findUniqueOrThrow({ where: { id: newAssigneeId } });

    if (claim.assignedToId !== newAssignee.id) {
        await prisma.claim.update({ where: { id: claimId }, data: { assignedToId: newAssignee.id } });
        await prisma.claimHistory.create({
            data: {
                claimId,
                userId: currentUser.id,
                authorName: currentUser.name,
                type: SYSTEM_HISTORY_TYPES.ASIGNACION,
                text: `Reasignado manualmente a: ${newAssignee.name}.`,
            },
        });
    }

    revalidatePath(`/reclamos/${claimId}`);
}
