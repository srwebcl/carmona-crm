import Link from 'next/link';
import { ChevronRight, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { Claim, User } from '@prisma/client';
import { statusLabel, CLOSED_STATUSES, DEFAULT_SLA_BUSINESS_DAYS } from '@/lib/constants';
import { businessDaysBetween } from '@/lib/businessDays';

function getStatusStyle(status: string) {
    switch (status) {
        case 'NUEVO': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'EN_REVISION': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'ESPERANDO_CLIENTE': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'RESUELTO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'CERRADO': return 'bg-slate-100 text-slate-700 border-slate-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

type ClaimWithAssignee = Claim & { assignedTo: User; lastActionAt: Date };

export function ClaimsTable({ claims }: { claims: ClaimWithAssignee[] }) {
    const thresholdDays = Number(process.env.SLA_BUSINESS_DAYS ?? DEFAULT_SLA_BUSINESS_DAYS);

    return (
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
                        {claims.map((claim) => {
                            const isOverdue = !CLOSED_STATUSES.includes(claim.status as 'RESUELTO' | 'CERRADO')
                                && businessDaysBetween(claim.lastActionAt, new Date()) >= thresholdDays;

                            return (
                                <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-sm group-hover:bg-indigo-100 transition-colors">{claim.code}</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{claim.customerName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{claim.email}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">{claim.brand} {claim.vehicleModel}</span>
                                            <span className="text-xs text-slate-500">{claim.area}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx('px-3 py-1.5 rounded-full text-xs font-bold border', getStatusStyle(claim.status))}>
                                            {statusLabel(claim.status)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold mr-2">
                                                {claim.assignedTo.name.charAt(0)}
                                            </div>
                                            <span className="text-sm text-slate-700 font-medium">{claim.assignedTo.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex items-center">
                                            <span className="text-slate-600 font-medium">{new Date(claim.createdAt).toLocaleDateString('es-CL')}</span>
                                            {isOverdue && <div title="SLA Vencido"><AlertCircle size={14} className="text-red-500 ml-2" /></div>}
                                        </div>
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <Link
                                            href={`/reclamos/${claim.id}`}
                                            className="inline-flex p-2 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <ChevronRight size={20} />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {claims.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <AlertCircle size={48} className="mb-4 text-slate-300" />
                                        <p className="text-lg font-medium text-slate-600">No hay tickets para mostrar</p>
                                        <p className="text-sm mt-1">Prueba ajustando la búsqueda o los filtros.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
