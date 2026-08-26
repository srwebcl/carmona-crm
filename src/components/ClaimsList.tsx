import { Search, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import clsx from 'clsx';

export function ClaimsList() {
    const { claims, currentUser, setSelectedClaim, setCurrentView } = useCrm();

    // Filtrar reclamos según usuario actual
    const visibleClaims = claims.filter(c => {
        if (currentUser.role === 'Gerencia') return true;
        return c.assignedTo === currentUser.name;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Nuevo': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Revisión': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Esperando Cliente': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Resuelto': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Cerrado': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800">
                        {currentUser.role === 'Gerencia' ? 'Todos los Tickets' : 'Mis Tickets Asignados'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestiona y da seguimiento a los casos de clientes.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar ticket o cliente..." 
                            className="pl-10 pr-4 py-2.5 w-64 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm" 
                        />
                    </div>
                    <button className="flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm shadow-sm">
                        <Filter size={16} className="mr-2" /> Filtrar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4 pl-6 font-semibold">ID Ticket</th>
                                <th className="p-4 font-semibold">Cliente</th>
                                <th className="p-4 font-semibold">Vehículo & Área</th>
                                <th className="p-4 font-semibold">Estado</th>
                                <th className="p-4 font-semibold">Responsable</th>
                                <th className="p-4 font-semibold">Fecha Ingreso</th>
                                <th className="p-4 font-semibold text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visibleClaims.map(claim => {
                                const isOverdue = (new Date().getTime() - new Date(claim.createdAt).getTime()) / (1000 * 60 * 60) > 48 
                                    && claim.status !== 'Resuelto' && claim.status !== 'Cerrado';

                                return (
                                <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-sm group-hover:bg-indigo-100 transition-colors">{claim.id}</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{claim.customer}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{claim.email}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">{claim.brand}</span>
                                            <span className="text-xs text-slate-500">{claim.area}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx(`px-3 py-1.5 rounded-full text-xs font-bold border`, getStatusStyle(claim.status))}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold mr-2">
                                                {claim.assignedTo.charAt(0)}
                                            </div>
                                            <span className="text-sm text-slate-700 font-medium">{claim.assignedTo}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex items-center">
                                            <span className="text-slate-600 font-medium">{new Date(claim.createdAt).toLocaleDateString()}</span>
                                            {isOverdue && (
                                                <div title="SLA Vencido"><AlertCircle size={14} className="text-red-500 ml-2" /></div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <button
                                            onClick={() => { setSelectedClaim(claim); setCurrentView('detail'); }}
                                            className="p-2 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                            {visibleClaims.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <AlertCircle size={48} className="mb-4 text-slate-300" />
                                            <p className="text-lg font-medium text-slate-600">No hay tickets para mostrar</p>
                                            <p className="text-sm mt-1">Actualmente no tienes reclamos asignados a tu bandeja.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
