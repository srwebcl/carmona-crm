'use client';

import { useEffect } from 'react';

const ALLOWED_PARENT_ORIGINS = ['https://www.automotrizcarmona.cl', 'https://automotrizcarmona.cl'];

/**
 * Le informa a la página padre (cuando este formulario está embebido en un
 * <iframe>, ej. en reclamos.automotrizcarmona.cl) la altura real del
 * contenido, para que el padre pueda ajustar el alto del iframe sin scroll
 * interno ni espacio vacío. No hace nada si la página no está embebida.
 */
export function IframeHeightReporter() {
    useEffect(() => {
        if (window.parent === window) return;

        function reportHeight() {
            const height = document.documentElement.scrollHeight;
            for (const origin of ALLOWED_PARENT_ORIGINS) {
                window.parent.postMessage({ source: 'crm-reclamos', type: 'resize', height }, origin);
            }
        }

        reportHeight();
        const observer = new ResizeObserver(reportHeight);
        observer.observe(document.documentElement);
        return () => observer.disconnect();
    }, []);

    return null;
}
