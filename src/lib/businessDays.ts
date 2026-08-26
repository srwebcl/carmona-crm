/**
 * Cuenta días hábiles (lunes a viernes) transcurridos entre dos fechas.
 * No descuenta feriados (se puede extender con un calendario de feriados
 * chilenos si se necesita mayor precisión).
 */
export function businessDaysBetween(from: Date, to: Date): number {
    if (to <= from) return 0;

    let count = 0;
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    while (cursor < end) {
        cursor.setDate(cursor.getDate() + 1);
        const day = cursor.getDay(); // 0 = domingo, 6 = sábado
        if (day !== 0 && day !== 6) count++;
    }

    return count;
}
