import 'server-only';
import type { User } from '@prisma/client';
import { prisma } from './prisma';
import { hoursBetween } from './hours';
import { CLOSED_STATUSES, DEFAULT_SLA_HOURS } from './constants';
import { buildClaimsWhere } from './claimsFilter';

export interface Notification {
    id: string;
    text: string;
    urgent?: boolean;
}

/** Notificaciones para la campanita del header: nuevos sin revisar y SLA vencido, en todo lo que el usuario puede ver (ver canAccessClaim). */
export async function getNotifications(currentUser: User): Promise<Notification[]> {
    const thresholdHours = Number(process.env.SLA_HOURS ?? DEFAULT_SLA_HOURS);

    const claims = await prisma.claim.findMany({
        where: {
            AND: [buildClaimsWhere(currentUser, {}), { status: { notIn: CLOSED_STATUSES } }],
        },
        include: { history: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    const notifications: Notification[] = [];
    for (const claim of claims) {
        if (claim.status === 'NUEVO') {
            notifications.push({ id: claim.code, text: `Nuevo reclamo sin revisar: ${claim.code}` });
        }
        const lastActionDate = claim.history[0]?.createdAt ?? claim.createdAt;
        const hours = hoursBetween(lastActionDate, new Date());
        if (hours >= thresholdHours) {
            notifications.push({ id: `${claim.code}-sla`, text: `Reclamo atrasado (≥${thresholdHours} horas sin gestión) en ${claim.code}`, urgent: true });
        }
    }
    return notifications;
}
