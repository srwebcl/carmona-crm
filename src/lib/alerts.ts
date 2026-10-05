import 'server-only';
import { prisma } from './prisma';
import { hoursBetween } from './hours';
import { sendMail, slaAlertEmail } from './mailer';
import { CLOSED_STATUSES, DEFAULT_SLA_HOURS, SYSTEM_HISTORY_TYPES } from './constants';

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Revisa todos los reclamos abiertos y, para los que llevan >= N horas sin
 * ninguna gestión registrada, envía un correo de alerta al responsable (una
 * sola vez por día por reclamo) y deja registro en el historial y en
 * AlertLog.
 *
 * Se invoca desde el cron diario (ver instrumentation.ts) y también puede
 * llamarse manualmente para pruebas.
 */
export async function runSlaAlertCheck() {
    const thresholdHours = Number(process.env.SLA_HOURS ?? DEFAULT_SLA_HOURS);
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    const claims = await prisma.claim.findMany({
        where: { status: { notIn: CLOSED_STATUSES } },
        include: {
            assignedTo: true,
            history: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
    });

    let alertsSent = 0;

    for (const claim of claims) {
        const lastActionDate = claim.history[0]?.createdAt ?? claim.createdAt;
        const hoursWithoutManagement = hoursBetween(lastActionDate, new Date());

        if (hoursWithoutManagement < thresholdHours) continue;

        const alreadySentToday = await prisma.alertLog.findFirst({
            where: { claimId: claim.id, sentAt: { gte: startOfToday() } },
        });
        if (alreadySentToday) continue;

        const email = slaAlertEmail({
            code: claim.code,
            customerName: claim.customerName,
            hoursWithoutManagement: Math.floor(hoursWithoutManagement),
            url: `${appUrl}/reclamos/${claim.id}`,
        });

        try {
            await sendMail({ to: claim.assignedTo.email, subject: email.subject, html: email.html });
        } catch (err) {
            // Un correo que falla (SMTP caído, credenciales inválidas, etc.)
            // no debe frenar la revisión del resto de los reclamos. No se
            // registra el envío ya que en realidad no llegó — se reintentará
            // en la próxima corrida del cron.
            console.error(`[sla-cron] no se pudo enviar la alerta para ${claim.code}:`, err);
            continue;
        }

        await prisma.$transaction([
            prisma.alertLog.create({
                data: { claimId: claim.id, thresholdHours: Math.floor(hoursWithoutManagement) },
            }),
            prisma.claimHistory.create({
                data: {
                    claimId: claim.id,
                    userId: null,
                    authorName: 'Sistema',
                    type: SYSTEM_HISTORY_TYPES.ALERTA_ENVIADA,
                    text: `Alerta automática enviada a ${claim.assignedTo.name} (${claim.assignedTo.email}): ${Math.floor(hoursWithoutManagement)} horas sin gestión.`,
                },
            }),
        ]);

        alertsSent++;
    }

    return { checked: claims.length, alertsSent };
}
