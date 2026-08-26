import 'server-only';
import type { User } from '@prisma/client';
import { prisma } from './prisma';
import { businessDaysBetween } from './businessDays';
import { CLOSED_STATUSES, DEFAULT_SLA_BUSINESS_DAYS, isGerenciaRole } from './constants';

export interface Notification {
    id: string;
    text: string;
    urgent?: boolean;
}

/** Notificaciones para la campanita del header: nuevos sin revisar y SLA vencido. */
export async function getNotifications(currentUser: User): Promise<Notification[]> {
    const thresholdDays = Number(process.env.SLA_BUSINESS_DAYS ?? DEFAULT_SLA_BUSINESS_DAYS);

    const claims = await prisma.claim.findMany({
        where: {
            status: { notIn: CLOSED_STATUSES },
            ...(isGerenciaRole(currentUser.role) ? {} : { assignedToId: currentUser.id }),
        },
        include: { history: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    const notifications: Notification[] = [];
    for (const claim of claims) {
        if (claim.status === 'NUEVO') {
            notifications.push({ id: claim.code, text: `Nuevo reclamo sin revisar: ${claim.code}` });
        }
        const lastActionDate = claim.history[0]?.createdAt ?? claim.createdAt;
        const days = businessDaysBetween(lastActionDate, new Date());
        if (days >= thresholdDays) {
            notifications.push({ id: `${claim.code}-sla`, text: `SLA vencido (≥${thresholdDays} días hábiles) en ${claim.code}`, urgent: true });
        }
    }
    return notifications;
}
