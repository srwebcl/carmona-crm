'use client';

import { useActionState, useRef, useState } from 'react';
import { Plus, Paperclip } from 'lucide-react';
import { BRANDS, AREAS, CHANNELS } from '@/lib/constants';
import type { ClaimFormState } from '@/actions/claims';

type ClaimAction = (prevState: ClaimFormState, formData: FormData) => Promise<ClaimFormState>;

interface ClaimFormProps {
    action: ClaimAction;
    /** true en /reclamos/nuevo (ingreso manual por admin): agrega el selector de canal. */
    isManual?: boolean;
    title: string;
    subtitle: string;
    submitLabel: string;
}

const initialState: ClaimFormState = {};

export function ClaimForm({ action, isManual = false, title, subtitle, submitLabel }: ClaimFormProps) {
    const [state, formAction, pending] = useActionState(action, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileNames, setFileNames] = useState<string[]>([]);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center mt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6 transform rotate-3">
                    <Plus size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800">{title}</h2>
                <p className="text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">{subtitle}</p>
            </div>

            <div className="glass-card p-8 md:p-10 border-t-4 border-t-indigo-500">
                <form action={formAction} className="space-y-6">
                    {isManual && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Canal de ingreso *</label>
                            <select name="channel" required defaultValue="PHONE" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                                {CHANNELS.filter((c) => c.value !== 'WEB').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="border-b border-slate-100 pb-6 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">1. Datos del Cliente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre Completo *</label>
                                <input name="customerName" required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Ej. Ana López" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Teléfono *</label>
                                <input name="phone" required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="+56 9 1234 5678" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo Electrónico *</label>
                                <input name="email" required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="ana@ejemplo.com" />
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-slate-100 pb-6 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">2. Datos del Vehículo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Marca *</label>
                                <select name="brand" required defaultValue={BRANDS[0]} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Modelo *</label>
                                <input name="vehicleModel" required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Ej. Yaris, Hilux..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Patente *</label>
                                <input name="plate" required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase" placeholder="AB1234" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Fecha de compra o de visita *</label>
                                <input name="eventDate" required type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">3. Detalle del Caso</h3>
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Área Relacionada *</label>
                            <select name="area" required defaultValue={AREAS[0]} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Describa los hechos *</label>
                            <textarea name="description" required rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" placeholder="Entregue la mayor cantidad de detalles posible..."></textarea>
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Solución esperada *</label>
                            <textarea name="expectedSolution" required rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" placeholder="¿Qué solución esperas de parte de Carmona?"></textarea>
                        </div>

                        <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center text-center">
                                <Paperclip size={24} className="text-slate-400 mb-2" />
                                <p className="text-sm font-medium text-slate-700">Adjuntar imágenes o documentos</p>
                                <p className="text-xs text-slate-500 mt-1 mb-3">PDF, JPG, PNG</p>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors shadow-sm">
                                    Seleccionar Archivos
                                </button>
                                <input
                                    type="file" name="attachments" ref={fileInputRef} className="hidden" multiple
                                    onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
                                />
                            </div>
                            {fileNames.length > 0 && (
                                <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm text-slate-600">
                                    {fileNames.map((n) => <p key={n} className="truncate">📎 {n}</p>)}
                                </div>
                            )}
                        </div>
                    </div>

                    {state.error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-4">{state.error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full bg-indigo-600 text-white font-bold text-lg py-4 px-4 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {pending ? 'Procesando...' : submitLabel}
                    </button>
                </form>
            </div>
        </div>
    );
}
