'use client';

import { useActionState } from 'react';
import { LogIn } from 'lucide-react';
import { loginAction, type LoginState } from '@/actions/auth';

const initialState: LoginState = {};

export function LoginForm({ next }: { next?: string }) {
    const [state, formAction, pending] = useActionState(loginAction, initialState);

    return (
        <form action={formAction} className="glass-card w-full max-w-sm p-8 border-t-4 border-t-indigo-500 space-y-5">
            <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
                    <LogIn size={26} className="text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-800">CARMONA CRM</h1>
                <p className="text-slate-500 text-sm mt-1">Ingresa con tu correo corporativo</p>
            </div>

            {next && <input type="hidden" name="next" value={next} />}

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo corporativo</label>
                <input name="email" type="email" required autoFocus className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="nombre@carmona.cl" />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Contraseña o PIN</label>
                <input name="password" type="password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" />
            </div>

            {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{state.error}</div>}

            <button type="submit" disabled={pending} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-70">
                {pending ? 'Ingresando...' : 'Ingresar'}
            </button>
        </form>
    );
}
