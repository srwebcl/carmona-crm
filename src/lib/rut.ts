/**
 * Validación de RUT chileno (dígito verificador módulo 11), no solo formato.
 * Acepta con o sin puntos/guion (ej. "12.345.678-9" o "123456789").
 */
export function isValidRut(raw: string): boolean {
    const clean = raw.replace(/[.\s]/g, '').toUpperCase();
    const match = clean.match(/^(\d{1,8})-?([0-9K])$/);
    if (!match) return false;

    const [, body, checkDigit] = match;
    return computeCheckDigit(body) === checkDigit;
}

function computeCheckDigit(body: string): string {
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += Number(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
}

/** Normaliza a formato "12.345.678-9" para guardar/mostrar consistente. */
export function formatRut(raw: string): string {
    const clean = raw.replace(/[.\s]/g, '').toUpperCase();
    const match = clean.match(/^(\d{1,8})-?([0-9K])$/);
    if (!match) return raw.trim();

    const [, body, checkDigit] = match;
    const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withDots}-${checkDigit}`;
}
