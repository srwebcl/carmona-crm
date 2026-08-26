import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const currentUser = await requireUser();
    const notifications = await getNotifications(currentUser);

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full bg-purple-100/50 blur-[100px]"></div>
            </div>

            <Suspense fallback={null}>
                <Sidebar currentUser={currentUser} />
            </Suspense>

            <div className="flex-1 flex flex-col h-screen relative z-10">
                <Header currentUser={currentUser} notifications={notifications} />
                <main className="flex-1 overflow-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
