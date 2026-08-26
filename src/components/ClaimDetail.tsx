import { useState, useEffect, useRef } from 'react';
import { Send, User, ChevronLeft, Calendar, Phone, Mail, Car, MapPin, Tag, Paperclip, FileText, X, Clock } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { STATUSES } from '../data';
import clsx from 'clsx';

export function ClaimDetail() {
    const { selectedClaim, currentUser, claims, setClaims, setSelectedClaim, setCurrentView } = useCrm();
    const [note, setNote] = useState('');
    const [status, setStatus] = useState(selectedClaim?.status || '');
    const [chatFiles, setChatFiles] = useState<{name: string, size: number, type: string}[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedClaim) {
            setStatus(selectedClaim.status);
        }
    }, [selectedClaim]);

    useEffect(() => {
        // Auto scroll al final del chat cuando se agrega un mensaje
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedClaim?.history]);

    if (!selectedClaim) return null;

    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'Nuevo': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Revisión': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Esperando Cliente': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Resuelto': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Cerrado': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(f => ({
                name: f.name,
                size: f.size,
                type: f.type
            }));
            setChatFiles([...chatFiles, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setChatFiles(chatFiles.filter((_, i) => i !== index));
    };

    const handleSaveNote = () => {
        if (!note.trim() && chatFiles.length === 0) return;

        const newHistory = {
            id: Date.now(),
            date: new Date().toISOString(),
            user: currentUser.name,
            type: 'Nota Interna',
            text: note || 'Archivos adjuntos enviados.',
            attachments: chatFiles.length > 0 ? chatFiles : undefined
        };

        const updatedClaim = { ...selectedClaim, history: [...selectedClaim.history, newHistory] };

        setClaims(claims.map(c => c.id === updatedClaim.id ? updatedClaim : c));
        setSelectedClaim(updatedClaim);
        setNote('');
        setChatFiles([]);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);

        const newHistory = {
            id: Date.now(),
            date: new Date().toISOString(),
            user: currentUser.name,
            type: 'Cambio de Estado',
            text: `Estado cambiado de "${selectedClaim.status}" a "${newStatus}"`
        };

        const updatedClaim = { ...selectedClaim, status: newStatus, history: [...selectedClaim.history, newHistory] };
        setClaims(claims.map(c => c.id === updatedClaim.id ? updatedClaim : c));
        setSelectedClaim(updatedClaim);

        if (newStatus === 'Resuelto') {
            alert(`✅ Sistema Automático:\n\nCorreo de resolución y encuesta de satisfacción (CSAT) enviado al cliente ${updatedClaim.customer}.`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center">
                    <button 
                        onClick={() => setCurrentView('claims')} 
                        className="mr-4 p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center">
                            <h2 className="text-2xl font-extrabold text-slate-800 mr-3">Ticket {selectedClaim.id}</h2>
                            <span className={clsx(`px-3 py-1 rounded-full text-xs font-bold border shadow-sm`, getStatusStyle(selectedClaim.status))}>
                                {selectedClaim.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 flex items-center">
                            <Calendar size={14} className="mr-1.5" /> Ingresado el {new Date(selectedClaim.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                    <label className="text-sm font-bold text-slate-700 ml-2">Estado:</label>
                    <select
                        value={status}
                        onChange={handleStatusChange}
                        className="bg-slate-50 border-slate-200 rounded-lg text-sm font-semibold p-2 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Información */}
                <div className="space-y-6">
                    {/* Tarjeta Cliente */}
                    <div className="glass-card overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <User size={18} className="mr-2 text-indigo-400" /> Información del Cliente
                            </h3>
                        </div>
                        <div className="p-5 space-y-4 bg-white">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                                <p className="font-bold text-slate-800 text-lg">{selectedClaim.customer}</p>
                            </div>
                            <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <Mail size={16} className="text-slate-400 mr-3" />
                                <span className="text-sm text-slate-700 font-medium">{selectedClaim.email}</span>
                            </div>
                            <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <Phone size={16} className="text-slate-400 mr-3" />
                                <span className="text-sm text-slate-700 font-medium">{selectedClaim.phone}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta Clasificación */}
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
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Marca</p>
                                    <p className="font-bold text-slate-800">{selectedClaim.brand}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <MapPin size={16} className="text-slate-400 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Área Derivada</p>
                                    <p className="font-bold text-slate-800">{selectedClaim.area}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Responsable Actual</p>
                                <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold mr-2">
                                        {selectedClaim.assignedTo.charAt(0)}
                                    </div>
                                    <p className="font-bold text-slate-700">{selectedClaim.assignedTo}</p>
                                </div>
                            </div>
                            
                            {selectedClaim.attachments && selectedClaim.attachments.length > 0 && (
                                <div className="pt-4 border-t border-slate-100 mt-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Archivos Adjuntos</p>
                                    <div className="space-y-2">
                                        {selectedClaim.attachments.map((file, i) => (
                                            <a key={i} href="#" onClick={(e) => { e.preventDefault(); alert('Descarga simulada'); }} className="flex items-center p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group">
                                                <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-100">
                                                    <FileText size={16} className="text-indigo-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
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

                {/* Columna Derecha: Bitácora y Chat */}
                <div className="lg:col-span-2 glass-card flex flex-col h-[750px] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-white">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Motivo Original del Reclamo</h3>
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                            <p className="text-slate-700 leading-relaxed font-medium italic text-[15px]">"{selectedClaim.detail}"</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center relative">
                            <span className="bg-slate-50/50 px-3 relative z-10">Bitácora de Gestión</span>
                            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-0"></div>
                        </h4>
                        
                        <div className="space-y-0 pl-2 mt-4 pb-10">
                            {selectedClaim.history.map((h, i) => {
                                const isSystem = h.user === 'Sistema';
                                const isLast = i === selectedClaim.history.length - 1;
                                
                                return (
                                    <div key={h.id} className="relative pl-8 pb-6 group">
                                        {/* Línea conectora */}
                                        {!isLast && (
                                            <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-slate-200"></div>
                                        )}
                                        
                                        {/* Punto del Timeline */}
                                        <div className={clsx(
                                            "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm z-10",
                                            isSystem ? "bg-slate-400" : "bg-indigo-500"
                                        )}></div>

                                        {/* Tarjeta de Contenido */}
                                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 border-b border-slate-100 pb-3 gap-2">
                                                <div>
                                                    <span className="font-extrabold text-slate-800 text-base">{h.user}</span>
                                                    <span className="ml-3 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                                        {h.type}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-semibold text-slate-500 flex items-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                    <Clock size={14} className="mr-1.5 text-slate-400" />
                                                    {new Date(h.date).toLocaleString(undefined, {
                                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            
                                            <p className="text-slate-700 text-[15px] whitespace-pre-wrap leading-relaxed font-medium">
                                                {h.text}
                                            </p>
                                            
                                            {h.attachments && h.attachments.length > 0 && (
                                                <div className="mt-4 pt-4 space-y-2 border-t border-slate-100">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documentos Adjuntos</p>
                                                    <div className="flex flex-wrap gap-3">
                                                        {h.attachments.map((att, idx) => (
                                                            <div key={idx} className="flex items-center p-2.5 rounded-lg text-sm bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors w-fit">
                                                                <FileText size={18} className="text-indigo-600 mr-2.5" />
                                                                <div>
                                                                    <p className="truncate font-bold text-slate-700 max-w-[200px] leading-tight">{att.name}</p>
                                                                    <p className="text-[10px] text-slate-500 mt-0.5">{(att.size / 1024).toFixed(1)} KB</p>
                                                                </div>
                                                            </div>
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

                    <div className="p-4 bg-white border-t border-slate-100">
                        {chatFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {chatFiles.map((file, i) => (
                                    <div key={i} className="flex items-center bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium">
                                        <Paperclip size={12} className="mr-1.5" />
                                        <span className="max-w-[150px] truncate mr-2">{file.name}</span>
                                        <button onClick={() => removeFile(i)} className="hover:text-red-500"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex items-end space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors shrink-0"
                                title="Adjuntar archivo"
                            >
                                <Paperclip size={20} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                            
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Escribe una nota interna, resolución o actualización..."
                                className="flex-1 bg-transparent border-none p-2 focus:ring-0 outline-none resize-none max-h-32 min-h-[44px] text-sm text-slate-700"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSaveNote();
                                    }
                                }}
                            ></textarea>
                            <button
                                onClick={handleSaveNote}
                                disabled={!note.trim() && chatFiles.length === 0}
                                className="bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex-shrink-0"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">Presiona Enter para enviar la nota. Shift + Enter para salto de línea.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
