import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default async function ClaimConfirmationPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
    const { code } = await searchParams;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="glass-card max-w-md w-full p-10 text-center border-t-4 border-t-emerald-500">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 mx-auto">
                    <CheckCircle size={32} />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-2">¡Reclamo recibido!</h1>
                {code && (
                    <p className="text-slate-600 mb-4">
                        Tu número de reclamo es <span className="font-bold text-indigo-600">{code}</span>.
                        Guárdalo para hacer seguimiento a tu caso.
                    </p>
                )}
                <p className="text-slate-500 text-sm mb-8">
                    Un ejecutivo del área correspondiente revisará tu caso a la brevedad y se contactará contigo.
                </p>
                <Link href="/reclamo" className="text-indigo-600 font-semibold text-sm hover:underline">
                    Ingresar otro reclamo
                </Link>
            </div>
        </div>
    );
}
