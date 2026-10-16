'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/SidebarContext';

export function MobileMenuButton() {
    const { toggle } = useSidebar();

    return (
        <button
            type="button"
            onClick={toggle}
            title="Abrir menú"
            className="lg:hidden p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm shrink-0"
        >
            <Menu size={20} className="text-slate-600" />
        </button>
    );
}
