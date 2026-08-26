import { LoginForm } from '@/components/LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const { next } = await searchParams;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <LoginForm next={next} />
        </div>
    );
}
