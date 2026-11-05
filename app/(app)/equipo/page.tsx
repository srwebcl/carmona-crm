import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasFullAccess } from '@/lib/routing';
import { TeamManagement } from '@/components/TeamManagement';

export default async function EquipoPage() {
    const currentUser = await requireUser();
    if (!hasFullAccess(currentUser)) notFound();

    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    return <TeamManagement users={users} />;
}
