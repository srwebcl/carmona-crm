'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

/**
 * Ícono de ayuda con tooltip. Se renderiza vía portal en <body> y se
 * posiciona en runtime (position: fixed) en vez de un <span absolute>
 * dentro del propio layout — las tarjetas del Dashboard usan
 * overflow-hidden (para el círculo decorativo de fondo) y un tooltip
 * posicionado normalmente quedaba cortado por ese límite.
 */
export function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const iconRef = useRef<HTMLSpanElement>(null);

    function openTooltip() {
        const rect = iconRef.current?.getBoundingClientRect();
        if (rect) setCoords({ top: rect.top, left: rect.left + rect.width / 2 });
        setShow(true);
    }

    return (
        <span
            ref={iconRef}
            className="relative inline-flex"
            onMouseEnter={openTooltip}
            onMouseLeave={() => setShow(false)}
        >
            <HelpCircle size={13} className="text-slate-400 cursor-help" />
            {show && createPortal(
                <span
                    role="tooltip"
                    className="pointer-events-none fixed z-50 w-56 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-medium normal-case tracking-normal text-white shadow-lg"
                    style={{ top: coords.top, left: coords.left }}
                >
                    {text}
                </span>,
                document.body,
            )}
        </span>
    );
}
