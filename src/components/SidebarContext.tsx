'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface SidebarContextValue {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** Coordina el menú lateral entre el botón hamburguesa (Header) y el drawer (Sidebar) en mobile. */
export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen((v) => !v), close: () => setIsOpen(false) }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error('useSidebar debe usarse dentro de SidebarProvider');
    return ctx;
}
