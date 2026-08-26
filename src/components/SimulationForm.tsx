import { useState, useRef } from 'react';
import { Plus, Check, Paperclip, X } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { BRANDS, AREAS, USERS } from '../data';

export function SimulationForm() {
    const { claims, setClaims, setCurrentView } = useCrm();

    const [simBrand, setSimBrand] = useState('Toyota');
    const [simArea, setSimArea] = useState('Servicio Técnico');
    const [simDetail, setSimDetail] = useState('');
    const [simName, setSimName] = useState('');
    const [simEmail, setSimEmail] = useState('');
    const [simPhone, setSimPhone] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<{name: string, size: number, type: string}[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const routeClaim = (brand: string, area: string) => {
        let assigned = USERS.find(u =>
            u.role !== 'Gerencia' &&
            (u.brands.includes(brand) || u.brands.includes('Todas')) &&
            (u.areas.includes(area) || u.areas.includes('Todas'))
        );
        if (!assigned) assigned = USERS[0];
        return assigned.name;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(f => ({
                name: f.name,
                size: f.size,
                type: f.type
            }));
            setAttachedFiles([...attachedFiles, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
    };

    const handleSimulateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            const assignedUser = routeClaim(simBrand, simArea);
            const newClaim = {
                id: `REC-${1000 + claims.length + 1}`,
                customer: simName || 'Cliente Anónimo',
                email: simEmail || 'cliente@ejemplo.cl',
                phone: simPhone || '+569 0000 0000',
                brand: simBrand,
                area: simArea,
                detail: simDetail,
                status: 'Nuevo',
                assignedTo: assignedUser,
                createdAt: new Date().toISOString(),
                attachments: attachedFiles,
                history: [
                    { id: 1, date: new Date().toISOString(), user: 'Sistema', type: 'Creación', text: 'Reclamo ingresado desde portal web de clientes.' },
                    { id: 2, date: new Date().toISOString(), user: 'Sistema', type: 'Asignación Automática', text: `Enrutado según reglas de negocio a: ${assignedUser}` }
                ]
            };

            setClaims([newClaim, ...claims]);
            setSimDetail('');
            setSimName('');
            setSimEmail('');
            setSimPhone('');
            setAttachedFiles([]);
            
            setIsSubmitting(false);
            setSuccessMsg(`¡Reclamo creado exitosamente! Fue asignado a: ${assignedUser}`);
            
            setTimeout(() => {
                setSuccessMsg('');
                setCurrentView('claims');
            }, 3000);

        }, 800); // Simulamos delay de red
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center mt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6 transform rotate-3">
                    <Plus size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800">Simulador de Portal Web</h2>
                <p className="text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">
                    Usa este formulario para simular cómo un cliente ingresaría un reclamo en la web pública. Observa cómo el motor del CRM lo enruta automáticamente al jefe correcto.
                </p>
            </div>

            <div className="glass-card p-8 md:p-10 border-t-4 border-t-indigo-500 relative">
                {successMsg && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <Check size={32} />
                        </div>
                        <p className="text-lg font-bold text-slate-800">{successMsg}</p>
                        <p className="text-slate-500 mt-2 text-sm animate-pulse">Redirigiendo a la bandeja...</p>
                    </div>
                )}

                <form onSubmit={handleSimulateSubmit} className="space-y-6">
                    <div className="border-b border-slate-100 pb-6 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">1. Datos Personales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre Completo *</label>
                                <input required value={simName} onChange={e => setSimName(e.target.value)} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Ej. Ana Lopez" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Teléfono</label>
                                <input value={simPhone} onChange={e => setSimPhone(e.target.value)} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="+56 9 1234 5678" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo Electrónico *</label>
                                <input required value={simEmail} onChange={e => setSimEmail(e.target.value)} type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="ana@ejemplo.com" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">2. Detalle del Caso</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Marca del Vehículo *</label>
                                <select value={simBrand} onChange={e => setSimBrand(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Área Relacionada *</label>
                                <select value={simArea} onChange={e => setSimArea(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Describa su problema *</label>
                            <textarea required value={simDetail} onChange={e => setSimDetail(e.target.value)} rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none mb-4" placeholder="Por favor entregue la mayor cantidad de detalles posible..."></textarea>
                            
                            <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <Paperclip size={24} className="text-slate-400 mb-2" />
                                    <p className="text-sm font-medium text-slate-700">Adjuntar imágenes o documentos</p>
                                    <p className="text-xs text-slate-500 mt-1 mb-3">PDF, JPG, PNG (Max 5MB)</p>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors shadow-sm">
                                        Seleccionar Archivos
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                                </div>
                                {attachedFiles.length > 0 && (
                                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                                        {attachedFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded-lg text-sm">
                                                <div className="flex items-center truncate">
                                                    <Paperclip size={14} className="text-indigo-500 mr-2 shrink-0" />
                                                    <span className="truncate font-medium text-slate-700 mr-2">{file.name}</span>
                                                    <span className="text-xs text-slate-400 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                                <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 ml-2">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 text-white font-bold text-lg py-4 px-4 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </span>
                        ) : 'Enviar Reclamo al Sistema'}
                    </button>
                </form>
            </div>

            <div className="p-5 bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-2xl text-sm text-blue-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                <h4 className="font-extrabold text-blue-900 mb-2 flex items-center text-base">
                    <span className="text-xl mr-2">🧠</span> Motor de Enrutamiento Activo:
                </h4>
                <ul className="list-disc pl-8 space-y-1.5 font-medium">
                    <li>Toyota + Servicio Técnico ➜ <span className="font-bold">Juanito Perez</span>.</li>
                    <li>Toyota + Ventas ➜ <span className="font-bold">Juanita Contreras</span>.</li>
                    <li>Cualquier Marca + Repuestos ➜ <span className="font-bold">Pepito</span>.</li>
                    <li>Nissan + Servicio Técnico ➜ <span className="font-bold">Carlos Gomez</span>.</li>
                    <li>Otras combinaciones (ej. Honda Ventas) ➜ <span className="font-bold">Admin General</span> (por defecto).</li>
                </ul>
            </div>
        </div>
    );
}
