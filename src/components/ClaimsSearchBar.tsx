'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { BRANDS } from '@/lib/constants';

/** Buscador funcional por nombre/código de reclamo, marca y rango de fecha (requisito 11). */
export function ClaimsSearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const [q, setQ] = useState(searchParams.get('q') ?? '');
    const [showFilters, setShowFilters] = useState(Boolean(searchParams.get('brand') || searchParams.get('from') || searchParams.get('to')));

    function updateParam(name: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(name, value);
        else params.delete(name);
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }

    function clearFilters() {
        setQ('');
        startTransition(() => router.push(pathname));
    }

    const hasFilters = Boolean(searchParams.get('q') || searchParams.get('brand') || searchParams.get('from') || searchParams.get('to'));

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
                <form
                    className="relative group"
                    onSubmit={(e) => { e.preventDefault(); updateParam('q', q); }}
                >
                    <Search className="absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nombre o N° de reclamo..."
                        className="pl-10 pr-4 py-2.5 w-72 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                    />
                </form>
                <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm shadow-sm"
                >
                    <Filter size={16} className="mr-2" /> Filtrar
                </button>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center px-3 py-2.5 text-slate-500 hover:text-red-600 text-sm font-medium"
                    >
                        <X size={16} className="mr-1" /> Limpiar
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Marca</label>
                        <select
                            defaultValue={searchParams.get('brand') ?? ''}
                            onChange={(e) => updateParam('brand', e.target.value)}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        >
                            <option value="">Todas</option>
                            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Desde</label>
                        <input
                            type="date"
                            defaultValue={searchParams.get('from') ?? ''}
                            onChange={(e) => updateParam('from', e.target.value)}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Hasta</label>
                        <input
                            type="date"
                            defaultValue={searchParams.get('to') ?? ''}
                            onChange={(e) => updateParam('to', e.target.value)}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
