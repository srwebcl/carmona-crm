'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Ticket, Plus, Users, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { logoutAction } from '@/actions/auth';
import type { User } from '@prisma/client';

const NAV_ITEMS = [
    { href: '/', label: 'Panel de Control', icon: LayoutDashboard, match: (p: string) => p === '/' },
    { href: '/reclamos', label: 'Tickets y Reclamos', icon: Ticket, match: (p: string) => p.startsWith('/reclamos') && p !== '/reclamos/nuevo' },
    { href: '/reclamos/nuevo', label: 'Ingresar Reclamo', icon: Plus, match: (p: string) => p === '/reclamos/nuevo' },
    { href: '/equipo', label: 'Equipo y Roles', icon: Users, match: (p: string) => p === '/equipo' },
];

export function Sidebar({ currentUser }: { currentUser: User }) {
    const pathname = usePathname();

    return (
        <div className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300">
            <div className="p-6 flex items-center justify-center border-b border-slate-800">
                <h1 className="text-2xl font-bold tracking-widest text-indigo-400">
                    CARMONA<span className="text-white"> CRM</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
                    const active = match(pathname);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(
                                'w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 font-medium group',
                                active
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                            )}
                        >
                            <Icon size={20} className={clsx('mr-3 transition-colors', active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400')} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-5 border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Sesión Activa</p>
                </div>
                <div className="flex items-center justify-between bg-slate-800 rounded-lg border border-slate-700 p-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
                    </div>
                    <form action={logoutAction}>
                        <button type="submit" title="Cerrar sesión" className="p-2 text-slate-400 hover:text-red-400 transition-colors shrink-0">
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
