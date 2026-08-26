import type { ReactNode } from 'react';
import { Ticket, Clock, AlertTriangle, CheckCircle, Download } from 'lucide-react';

interface DashboardProps {
    total: number;
    abiertos: number;
    resueltos: number;
    vencidos: number;
    topBrands: [string, number][];
    topAreas: [string, number][];
    exportHref: string;
    isFiltered: boolean;
    searchBar: ReactNode;
}

export function Dashboard({ total, abiertos, resueltos, vencidos, topBrands, topAreas, exportHref, isFiltered, searchBar }: DashboardProps) {
    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Panel de Control</h2>
                    <p className="text-slate-500 mt-1">
                        {isFiltered
                            ? 'Métricas y descarga acotadas al filtro activo.'
                            : 'Resumen del estado actual de los reclamos y métricas clave.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {searchBar}
                    <a
                        href={exportHref}
                        className="flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm shadow-sm shrink-0"
                    >
                        <Download size={16} className="mr-2" />
                        {isFiltered ? 'Descargar filtrado (CSV)' : 'Descargar base completa (CSV)'}
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="glass-card p-6 flex items-center space-x-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 z-10">
                        <Ticket size={28} />
                    </div>
                    <div className="z-10">
                        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Reclamos</p>
                        <p className="text-3xl font-extrabold text-slate-800">{total}</p>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center space-x-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                    <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-2xl shadow-lg shadow-yellow-500/30 z-10">
                        <Clock size={28} />
                    </div>
                    <div className="z-10">
                        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">Abiertos</p>
                        <p className="text-3xl font-extrabold text-slate-800">{abiertos}</p>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center space-x-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                    <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl shadow-lg shadow-red-500/30 z-10">
                        <AlertTriangle size={28} />
                    </div>
                    <div className="z-10">
                        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">SLA Vencido</p>
                        <p className="text-3xl font-extrabold text-red-600">{vencidos}</p>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center space-x-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                    <div className="p-4 bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-2xl shadow-lg shadow-green-500/30 z-10">
                        <CheckCircle size={28} />
                    </div>
                    <div className="z-10">
                        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">Resueltos</p>
                        <p className="text-3xl font-extrabold text-slate-800">{resueltos}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-8 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl"></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 relative z-10">Reclamos por Marca</h3>
                    <div className="space-y-6 relative z-10">
                        {topBrands.map(([brand, count], i) => (
                            <div key={brand}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-slate-700 flex items-center">
                                        <span className="w-6 text-slate-400 font-normal text-xs">{i + 1}.</span> {brand}
                                    </span>
                                    <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">{count} tickets</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full" style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        ))}
                        {topBrands.length === 0 && <p className="text-sm text-slate-400">Sin datos todavía.</p>}
                    </div>
                </div>

                <div className="glass-card p-8 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-50 rounded-full blur-3xl"></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 relative z-10">Reclamos por Área</h3>
                    <div className="space-y-6 relative z-10">
                        {topAreas.map(([area, count], i) => (
                            <div key={area}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-slate-700 flex items-center">
                                        <span className="w-6 text-slate-400 font-normal text-xs">{i + 1}.</span> {area}
                                    </span>
                                    <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">{count} tickets</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-teal-400 to-emerald-500 h-2.5 rounded-full" style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        ))}
                        {topAreas.length === 0 && <p className="text-sm text-slate-400">Sin datos todavía.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
