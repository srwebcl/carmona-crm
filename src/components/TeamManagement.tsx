import { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import { Shield, Plus, X } from 'lucide-react';
import { BRANDS, AREAS } from '../data';
import type { User } from '../types';

export function TeamManagement() {
    const { users, setUsers } = useCrm();
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [role, setRole] = useState('Jefe Area');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

    const toggleBrand = (brand: string) => {
        if (brand === 'Todas') {
            setSelectedBrands(['Todas']);
            return;
        }
        let newBrands = selectedBrands.filter(b => b !== 'Todas');
        if (newBrands.includes(brand)) {
            newBrands = newBrands.filter(b => b !== brand);
        } else {
            newBrands.push(brand);
        }
        setSelectedBrands(newBrands);
    };

    const toggleArea = (area: string) => {
        if (area === 'Todas') {
            setSelectedAreas(['Todas']);
            return;
        }
        let newAreas = selectedAreas.filter(a => a !== 'Todas');
        if (newAreas.includes(area)) {
            newAreas = newAreas.filter(a => a !== area);
        } else {
            newAreas.push(area);
        }
        setSelectedAreas(newAreas);
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        const newUser: User = {
            id: Date.now(),
            name,
            role,
            brands: selectedBrands.length > 0 ? selectedBrands : ['Todas'],
            areas: selectedAreas.length > 0 ? selectedAreas : ['Todas']
        };

        setUsers([...users, newUser]);
        
        setName('');
        setRole('Jefe Area');
        setSelectedBrands([]);
        setSelectedAreas([]);
        setShowForm(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center">
                        <Shield className="mr-3 text-indigo-600" size={28} />
                        Administración de Equipo y Roles
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Crea perfiles y define áreas de responsabilidad para el enrutamiento automático.</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-medium text-sm"
                    >
                        <Plus size={18} className="mr-2" /> Nuevo Perfil
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-card p-6 border-t-4 border-t-indigo-500 relative">
                    <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Crear Nuevo Perfil</h3>
                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre Completo *</label>
                                <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Roberto Sanchez" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Cargo / Rol *</label>
                                <input required value={role} onChange={e => setRole(e.target.value)} type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Jefe Ventas Usados" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Marcas Administradas</label>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => toggleBrand('Todas')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedBrands.includes('Todas') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                                    Todas
                                </button>
                                {BRANDS.map(b => (
                                    <button type="button" key={b} onClick={() => toggleBrand(b)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedBrands.includes(b) && !selectedBrands.includes('Todas') ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Áreas Administradas</label>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => toggleArea('Todas')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedAreas.includes('Todas') ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                                    Todas
                                </button>
                                {AREAS.map(a => (
                                    <button type="button" key={a} onClick={() => toggleArea(a)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedAreas.includes(a) && !selectedAreas.includes('Todas') ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}>
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                                Guardar Perfil
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                            <th className="p-4 pl-6 font-semibold">Usuario</th>
                            <th className="p-4 font-semibold">Rol</th>
                            <th className="p-4 font-semibold">Marcas a cargo</th>
                            <th className="p-4 font-semibold">Áreas a cargo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold mr-3">
                                            {u.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-slate-800">{u.name}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold border border-slate-200">{u.role}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {u.brands.map((b, i) => (
                                            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">{b}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {u.areas.map((a, i) => (
                                            <span key={i} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">{a}</span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
