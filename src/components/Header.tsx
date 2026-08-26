import { Bell, LogOut } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import clsx from 'clsx';

export function Header() {
    const { currentUser, notifications } = useCrm();

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10 shadow-sm">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    Bienvenido de vuelta, <span className="text-indigo-600 ml-1.5">{currentUser.name.split(' ')[0]}</span>
                    <span className="ml-3 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                        {currentUser.role}
                    </span>
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Aquí tienes un resumen de la actividad de hoy.</p>
            </div>

            <div className="flex items-center space-x-6">
                {/* Notificaciones */}
                <div className="relative cursor-pointer group">
                    <div className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm">
                        <Bell size={20} className="text-slate-600" />
                    </div>
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                            {notifications.length}
                        </span>
                    )}
                    
                    {/* Tooltip Notificaciones */}
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                            <span className="text-sm font-bold text-slate-800">Notificaciones Recientes</span>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{notifications.length} nuevas</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-sm text-slate-500 text-center flex flex-col items-center">
                                    <Bell size={24} className="text-slate-300 mb-2" />
                                    No tienes notificaciones pendientes.
                                </div>
                            ) : notifications.map((n, i) => (
                                <div key={i} className={clsx(
                                    "p-4 text-sm border-b last:border-b-0 transition-colors flex items-start",
                                    n.urgent ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'
                                )}>
                                    <div className={clsx("w-2 h-2 rounded-full mt-1.5 mr-3 shrink-0", n.urgent ? 'bg-red-500 animate-pulse' : 'bg-indigo-500')}></div>
                                    <span className={clsx(n.urgent ? 'text-red-800 font-medium' : 'text-slate-700')}>{n.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                {/* Perfil */}
                <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                        <p className="text-xs text-slate-500">{currentUser.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white">
                        {currentUser.name.charAt(0)}
                    </div>
                    <LogOut size={18} className="text-slate-400 ml-2 hover:text-red-500 transition-colors" />
                </div>
            </div>
        </header>
    );
}
