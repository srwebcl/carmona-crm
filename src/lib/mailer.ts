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

/**
 * Confirmación al cliente que presentó el reclamo — a diferencia del aviso
 * interno de abajo, esta sí lleva diseño de marca (logo, colores) porque la
 * ve alguien externo a la empresa. No incluye el link al CRM (ese es
 * interno) ni el nombre del responsable asignado (dato operativo interno).
 */
export function claimReceivedCustomerEmail(params: {
    code: string;
    customerName: string;
    area: string;
    brand: string | null;
    vehicleModel: string | null;
    description: string;
    logoUrl: string;
}) {
    const vehicleLine = params.brand ? `${params.brand} ${params.vehicleModel ?? ''}`.trim() : null;
    return {
        subject: `Recibimos tu reclamo — ${params.code}`,
        html: `
            <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
                <div style="background-color: #0f172a; padding: 28px 32px; border-radius: 12px 12px 0 0; text-align: center;">
                    <img src="${params.logoUrl}" alt="Carmona" width="160" style="display: block; margin: 0 auto;" />
                </div>
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
                    <p style="font-size: 16px; margin-top: 0;">Hola ${params.customerName},</p>
                    <p style="font-size: 15px; line-height: 1.5;">
                        Recibimos tu reclamo y ya quedó registrado en nuestro sistema. Nuestro equipo lo revisará y se pondrá en contacto contigo a la brevedad.
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Código de seguimiento</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${params.code}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Área</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${params.area}</td>
                        </tr>
                        ${vehicleLine ? `
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Vehículo</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${vehicleLine}</td>
                        </tr>` : ''}
                    </table>
                    <p style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Motivo de tu reclamo:</p>
                    <p style="font-size: 14px; background-color: #f8fafc; border-radius: 8px; padding: 14px; margin-top: 0;">${params.description}</p>
                    <p style="font-size: 13px; color: #94a3b8; margin-top: 28px; margin-bottom: 0;">
                        Guarda este código por si necesitas consultar por el estado de tu reclamo. Gracias por tu paciencia.
                    </p>
                </div>
            </div>
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
