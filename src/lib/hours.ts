/** Horas transcurridas (reloj corrido, sin descontar fines de semana) entre dos fechas. */
export function hoursBetween(from: Date, to: Date): number {
    if (to <= from) return 0;
    return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}
