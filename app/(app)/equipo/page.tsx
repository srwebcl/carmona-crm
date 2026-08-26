import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TeamManagement } from '@/components/TeamManagement';

export default async function EquipoPage() {
    await requireUser();
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    return <TeamManagement users={users} />;
}
