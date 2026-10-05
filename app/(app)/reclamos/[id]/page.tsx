import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessClaim } from '@/lib/routing';
import { ClaimDetail } from '@/components/ClaimDetail';

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const currentUser = await requireUser();
    const { id } = await params;
    const claimId = Number(id);
    if (!Number.isInteger(claimId)) notFound();

    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
        include: {
            assignedTo: true,
            attachments: { where: { historyId: null } },
            history: { orderBy: { createdAt: 'asc' }, include: { attachments: true } },
        },
    });
    if (!claim) notFound();

    // Visibilidad cruzada (punto 11): no solo el asignado puede ver/gestionar
    // el reclamo, también cualquiera cuyas marcas/áreas/sucursales calcen.
    if (!canAccessClaim(currentUser, claim)) {
        notFound();
    }

    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });

    return <ClaimDetail claim={claim} users={users} />;
}
