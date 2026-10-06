'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { BRANDS, AREAS } from '@/lib/constants';

interface ResponsableOption {
    id: number;
    name: string;
}

interface ClaimsSearchBarProps {
    /** Lista de responsables para el filtro — solo se usa/muestra si showResponsable es true. */
    responsables?: ResponsableOption[];
    /** Gerencia (o quien vea todo) puede filtrar por responsable; el resto ya ve su propio alcance. */
    showResponsable?: boolean;
}

/** Buscador funcional por nombre/código, marca, área, responsable y rango de fecha (requisitos 9 y 10). */
export function ClaimsSearchBar({ responsables = [], showResponsable = false }: ClaimsSearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const [q, setQ] = useState(searchParams.get('q') ?? '');
    const [showFilters, setShowFilters] = useState(
        Boolean(searchParams.get('brand') || searchParams.get('area') || searchParams.get('assignedToId') || searchParams.get('from') || searchParams.get('to')),
    );

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

    const hasFilters = Boolean(
        searchParams.get('q') || searchParams.get('brand') || searchParams.get('area') || searchParams.get('assignedToId') || searchParams.get('from') || searchParams.get('to'),
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2.5">
                <form
                    className="relative group min-w-0"
                    onSubmit={(e) => { e.preventDefault(); updateParam('q', q); }}
                >
                    <Search className="absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por cliente, N°, vehículo, área, sucursal, estado o responsable..."
                        className="pl-10 pr-4 py-2.5 w-56 lg:w-80 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                    />
                </form>
                <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    title="Filtrar"
                    aria-label="Filtrar"
                    className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm shrink-0"
                >
                    <Filter size={16} />
                </button>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center px-3 py-2.5 text-slate-500 hover:text-red-600 text-sm font-medium shrink-0"
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
                        <label className="block text-xs font-bold text-slate-500 mb-1">Área</label>
                        <select
                            defaultValue={searchParams.get('area') ?? ''}
                            onChange={(e) => updateParam('area', e.target.value)}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        >
                            <option value="">Todas</option>
                            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    {showResponsable && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Responsable</label>
                            <select
                                defaultValue={searchParams.get('assignedToId') ?? ''}
                                onChange={(e) => updateParam('assignedToId', e.target.value)}
                                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                            >
                                <option value="">Todos</option>
                                {responsables.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    )}
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
