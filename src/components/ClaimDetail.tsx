'use client';

import { useActionState, useRef, useState, useEffect, useTransition } from 'react';
import { Send, User as UserIcon, Calendar, Phone, Mail, Car, MapPin, Tag, Paperclip, FileText, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { Attachment, Claim, ClaimHistory, User } from '@prisma/client';
import { addHistoryEntry, changeClaimStatus, reassignClaim, type ClaimFormState } from '@/actions/claims';
import { STATUSES, RESOLUTION_TYPES, HISTORY_TYPES, CLOSED_STATUSES, channelLabel, historyTypeLabel } from '@/lib/constants';

type HistoryWithAttachments = ClaimHistory & { attachments: Attachment[] };
type ClaimWithRelations = Claim & { assignedTo: User; history: HistoryWithAttachments[]; attachments: Attachment[] };

function getStatusStyle(s: string) {
    switch (s) {
        case 'NUEVO': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'EN_REVISION': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'ESPERANDO_CLIENTE': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'RESUELTO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'CERRADO': return 'bg-slate-100 text-slate-700 border-slate-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

const initialState: ClaimFormState = {};

export function ClaimDetail({ claim, users }: { claim: ClaimWithRelations; users: User[] }) {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const noteFormRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [pendingStatus, setPendingStatus] = useState(claim.status);
    const [historyState, historyAction, historyPending] = useActionState(addHistoryEntry.bind(null, claim.id), initialState);
    const [statusState, statusAction, statusPending] = useActionState(changeClaimStatus.bind(null, claim.id), initialState);
    const [, startReassignTransition] = useTransition();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [claim.history.length]);

    useEffect(() => {
        if (historyState.success) noteFormRef.current?.reset();
    }, [historyState.success]);

    const needsResolution = CLOSED_STATUSES.includes(pendingStatus as 'RESUELTO' | 'CERRADO');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center flex-wrap gap-3">
                        <h2 className="text-2xl font-extrabold text-slate-800">Ticket {claim.code}</h2>
                        <span className={clsx('px-3 py-1 rounded-full text-xs font-bold border shadow-sm', getStatusStyle(claim.status))}>
                            {STATUSES.find((s) => s.value === claim.status)?.label}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-500 border-slate-200">
                            Canal: {channelLabel(claim.channel)}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 flex items-center">
                        <Calendar size={14} className="mr-1.5" /> Ingresado el {new Date(claim.createdAt).toLocaleString('es-CL')}
                    </p>
                </div>

                <form action={statusAction} className="flex flex-col items-end gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center space-x-3">
                        <label className="text-sm font-bold text-slate-700">Estado:</label>
                        <select
                            name="status"
                            value={pendingStatus}
                            onChange={(e) => setPendingStatus(e.target.value)}
                            className="bg-slate-50 border-slate-200 rounded-lg text-sm font-semibold p-2 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {needsResolution && (
                            <select name="resolutionType" defaultValue="" required className="bg-slate-50 border-slate-200 rounded-lg text-sm font-semibold p-2 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                                <option value="" disabled>Clasificación de respuesta...</option>
                                {RESOLUTION_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        )}
                        <button type="submit" disabled={statusPending} className="px-3 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                            Guardar
                        </button>
                    </div>
                    {statusState.error && <p className="text-xs text-red-600 font-medium">{statusState.error}</p>}
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <div className="glass-card overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <UserIcon size={18} className="mr-2 text-indigo-400" /> Información del Cliente
                            </h3>
                        </div>
                        <div className="p-5 space-y-4 bg-white">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                                <p className="font-bold text-slate-800 text-lg">{claim.customerName}</p>
                            </div>
                            <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <Mail size={16} className="text-slate-400 mr-3" />
                                <span className="text-sm text-slate-700 font-medium">{claim.email}</span>
                            </div>
                            <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <Phone size={16} className="text-slate-400 mr-3" />
                                <span className="text-sm text-slate-700 font-medium">{claim.phone}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                                <Tag size={16} className="mr-2 text-indigo-500" /> Detalles del Caso
                            </h3>
                        </div>
                        <div className="p-5 space-y-4 bg-white">
                            <div className="flex items-start">
                                <Car size={16} className="text-slate-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehículo</p>
                                    <p className="font-bold text-slate-800">{claim.brand} {claim.vehicleModel}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Patente: {claim.plate}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <MapPin size={16} className="text-slate-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Área Derivada</p>
                                    <p className="font-bold text-slate-800">{claim.area}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Calendar size={16} className="text-slate-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Compra/Visita</p>
                                    <p className="font-bold text-slate-800">{new Date(claim.eventDate).toLocaleDateString('es-CL')}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Solución Esperada</p>
                                <p className="text-sm text-slate-700">{claim.expectedSolution}</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Responsable Actual</p>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold mr-2">
                                            {claim.assignedTo.name.charAt(0)}
                                        </div>
                                        <p className="font-bold text-slate-700">{claim.assignedTo.name}</p>
                                    </div>
                                </div>
                                <form
                                    action={(formData) => startReassignTransition(() => reassignClaim(claim.id, formData))}
                                    className="flex items-center gap-2 mt-2"
                                >
                                    <select name="assignedToId" defaultValue={claim.assignedToId} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none">
                                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    <button type="submit" className="px-2.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors shrink-0">
                                        Reasignar
                                    </button>
                                </form>
                            </div>

                            {claim.attachments.length > 0 && (
                                <div className="pt-4 border-t border-slate-100 mt-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Archivos Adjuntos</p>
                                    <div className="space-y-2">
                                        {claim.attachments.map((file) => (
                                            <a key={file.id} href={file.path} target="_blank" rel="noreferrer" className="flex items-center p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group">
                                                <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-100">
                                                    <FileText size={16} className="text-indigo-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{file.filename}</p>
                                                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 glass-card flex flex-col h-[750px] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-white">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Motivo Original del Reclamo</h3>
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                            <p className="text-slate-700 leading-relaxed font-medium italic text-[15px]">&ldquo;{claim.description}&rdquo;</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center relative">
                            <span className="bg-slate-50/50 px-3 relative z-10">Bitácora de Gestión</span>
                            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-0"></div>
                        </h4>

                        <div className="space-y-0 pl-2 mt-4 pb-10">
                            {claim.history.map((h, i) => {
                                const isSystem = h.userId === null;
                                const isLast = i === claim.history.length - 1;

                                return (
                                    <div key={h.id} className="relative pl-8 pb-6 group">
                                        {!isLast && <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-slate-200"></div>}
                                        <div className={clsx('absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm z-10', isSystem ? 'bg-slate-400' : 'bg-indigo-500')}></div>

                                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 border-b border-slate-100 pb-3 gap-2">
                                                <div>
                                                    <span className="font-extrabold text-slate-800 text-base">{h.authorName}</span>
                                                    <span className="ml-3 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                                        {historyTypeLabel(h.type)}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-semibold text-slate-500 flex items-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                    <Clock size={14} className="mr-1.5 text-slate-400" />
                                                    {new Date(h.createdAt).toLocaleString('es-CL', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <p className="text-slate-700 text-[15px] whitespace-pre-wrap leading-relaxed font-medium">{h.text}</p>

                                            {h.attachments.length > 0 && (
                                                <div className="mt-4 pt-4 space-y-2 border-t border-slate-100">
                                                    <div className="flex flex-wrap gap-3">
                                                        {h.attachments.map((att) => (
                                                            <a key={att.id} href={att.path} target="_blank" rel="noreferrer" className="flex items-center p-2.5 rounded-lg text-sm bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors w-fit">
                                                                <FileText size={18} className="text-indigo-600 mr-2.5" />
                                                                <div>
                                                                    <p className="truncate font-bold text-slate-700 max-w-[200px] leading-tight">{att.filename}</p>
                                                                    <p className="text-[10px] text-slate-500 mt-0.5">{(att.size / 1024).toFixed(1)} KB</p>
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    <form ref={noteFormRef} action={historyAction} className="p-4 bg-white border-t border-slate-100 space-y-2">
                        <div className="flex items-end space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors shrink-0" title="Adjuntar archivo">
                                <Paperclip size={20} />
                            </button>
                            <input type="file" name="attachments" ref={fileInputRef} className="hidden" multiple />

                            <select name="type" defaultValue="NOTA" className="bg-transparent text-sm font-semibold text-slate-600 outline-none shrink-0">
                                {HISTORY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>

                            <textarea
                                name="text"
                                required
                                placeholder="Escribe una nota interna, resolución o resumen de la gestión..."
                                className="flex-1 bg-transparent border-none p-2 focus:ring-0 outline-none resize-none max-h-32 min-h-[44px] text-sm text-slate-700"
                                rows={1}
                            ></textarea>
                            <button type="submit" disabled={historyPending} className="bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex-shrink-0">
                                <Send size={18} />
                            </button>
                        </div>
                        {historyState.error && <p className="text-xs text-red-600 font-medium text-center">{historyState.error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}
