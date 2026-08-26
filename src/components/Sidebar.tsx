import { LayoutDashboard, Ticket, Plus, Users } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import clsx from 'clsx';

export function Sidebar() {
    const { currentView, setCurrentView, currentUser, setCurrentUser, users } = useCrm();

    return (
        <div className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300">
            <div className="p-6 flex items-center justify-center border-b border-slate-800">
                <h1 className="text-2xl font-bold tracking-widest text-indigo-400">
                    CARMONA<span className="text-white"> CRM</span>
                </h1>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2">
                <button
                    onClick={() => setCurrentView('dashboard')}
                    className={clsx(
                        "w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 font-medium group",
                        currentView === 'dashboard' 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                >
                    <LayoutDashboard size={20} className={clsx("mr-3 transition-colors", currentView === 'dashboard' ? "text-white" : "text-slate-500 group-hover:text-indigo-400")} /> 
                    Panel de Control
                </button>
                <button
                    onClick={() => setCurrentView('claims')}
                    className={clsx(
                        "w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 font-medium group",
                        (currentView === 'claims' || currentView === 'detail')
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                >
                    <Ticket size={20} className={clsx("mr-3 transition-colors", (currentView === 'claims' || currentView === 'detail') ? "text-white" : "text-slate-500 group-hover:text-indigo-400")} /> 
                    Tickets y Reclamos
                </button>
                <button
                    onClick={() => setCurrentView('simulate')}
                    className={clsx(
                        "w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 font-medium group mt-4 border border-dashed",
                        currentView === 'simulate' 
                            ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50" 
                            : "text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
                    )}
                >
                    <Plus size={20} className="mr-3" /> 
                    Simular Cliente Web
                </button>
                <button
                    onClick={() => setCurrentView('team')}
                    className={clsx(
                        "w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 font-medium group border border-transparent",
                        currentView === 'team' 
                            ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                >
                    <Users size={20} className="mr-3" /> 
                    Equipo y Roles
                </button>
            </nav>

            {/* Simulación de Rol (Solo para el prototipo) */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Usuario Activo (Demo)</p>
                </div>
                <select
                    className="w-full bg-slate-800 text-white text-sm p-3 rounded-lg border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer appearance-none"
                    value={currentUser.id}
                    onChange={(e) => setCurrentUser(users.find(u => u.id === parseInt(e.target.value))!)}
                >
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-8 text-slate-400 mt-8">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>
    );
}
