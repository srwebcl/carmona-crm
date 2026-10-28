import 'server-only';
import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend | null {
    if (client) return client;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        // Sin API key (ej. desarrollo local): no se envían correos reales,
        // solo se deja registro en consola para no romper el flujo.
        return null;
    }
    client = new Resend(apiKey);
    return client;
}

export async function sendMail(opts: { to: string | string[]; subject: string; html: string; cc?: string | string[] }) {
    const resend = getClient();
    const from = process.env.MAIL_FROM || 'Reclamos Carmona <reclamos@carmonaycia.cl>';

    if (!resend) {
        console.warn('[mailer] RESEND_API_KEY no configurada — correo simulado:', { to: opts.to, subject: opts.subject });
        return;
    }

    // ALERTS_CC (opcional) va en copia a TODO correo saliente, además de
    // cualquier cc puntual que pase el llamador.
    const alertsCc = process.env.ALERTS_CC;
    const cc = [...(opts.cc ? (Array.isArray(opts.cc) ? opts.cc : [opts.cc]) : []), ...(alertsCc ? [alertsCc] : [])];

    const { error } = await resend.emails.send({
        from,
        to: opts.to,
        cc: cc.length > 0 ? cc : undefined,
        subject: opts.subject,
        html: opts.html,
    });
    if (error) {
        throw new Error(`Resend: ${error.message}`);
    }
}

export function slaAlertEmail(params: { code: string; customerName: string; hoursWithoutManagement: number; url: string }) {
    return {
        subject: `⚠️ Reclamo atrasado — ${params.code} sin gestión hace ${params.hoursWithoutManagement} horas`,
        html: `
            <p>El reclamo <strong>${params.code}</strong> del cliente <strong>${params.customerName}</strong>
            lleva <strong>${params.hoursWithoutManagement} horas</strong> sin ninguna gestión registrada.</p>
            <p>Por favor ingresa a la plataforma y registra una acción o actualiza su estado:</p>
            <p><a href="${params.url}">${params.url}</a></p>
        `,
    };
}

export function resolutionEmail(params: { code: string; customerName: string; resolutionLabel: string }) {
    return {
        subject: `Resolución de tu reclamo ${params.code}`,
        html: `
            <p>Hola ${params.customerName},</p>
            <p>Te informamos que tu reclamo <strong>${params.code}</strong> ha sido resuelto.</p>
            <p>Resultado: <strong>${params.resolutionLabel}</strong></p>
            <p>Gracias por tu paciencia.</p>
        `,
    };
}

/** Aviso al crear un reclamo nuevo (manual, formulario web, o vía la web de Carmona) — va al admin y al responsable asignado. */
export function newClaimNotificationEmail(params: {
    code: string;
    customerName: string;
    area: string;
    brand: string | null;
    vehicleModel: string | null;
    description: string;
    assignedToName: string;
    url: string;
}) {
    const vehicleLine = params.brand ? `${params.brand} ${params.vehicleModel ?? ''}`.trim() : 'No aplica';
    return {
        subject: `🆕 Nuevo reclamo ${params.code} — ${params.area}`,
        html: `
            <p>Se ingresó un nuevo reclamo en el CRM de Reclamos Carmona.</p>
            <ul>
                <li><strong>Código:</strong> ${params.code}</li>
                <li><strong>Cliente:</strong> ${params.customerName}</li>
                <li><strong>Área:</strong> ${params.area}</li>
                <li><strong>Vehículo:</strong> ${vehicleLine}</li>
                <li><strong>Responsable asignado:</strong> ${params.assignedToName}</li>
            </ul>
            <p><strong>Motivo del reclamo:</strong><br>${params.description}</p>
            <p><a href="${params.url}">Ver el reclamo en el CRM</a></p>
        `,
    };
}
