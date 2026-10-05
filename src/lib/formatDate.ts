// Formateo de fechas con zona horaria fija (America/Santiago). Sin esto,
// `toLocaleString`/`toLocaleDateString` usan la zona horaria del entorno
// donde corren — que en SSR es la del servidor (ej. UTC en Vercel) y en el
// navegador es la del usuario — produciendo un texto distinto en cada
// pasada y un error de hidratación de React (#418) en cada carga completa
// de página.
const TIME_ZONE = 'America/Santiago';

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-CL', { timeZone: TIME_ZONE });
}

export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('es-CL', { timeZone: TIME_ZONE });
}

export function formatDateTimeLong(date: Date | string): string {
    return new Date(date).toLocaleString('es-CL', {
        timeZone: TIME_ZONE,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
