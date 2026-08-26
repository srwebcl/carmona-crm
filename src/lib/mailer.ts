import 'server-only';
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (transporter) return transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        // Sin configuración SMTP (ej. desarrollo local): no se envían correos
        // reales, solo se deja registro en consola para no romper el flujo.
        return null;
    }

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: Number(SMTP_PORT ?? 587) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
    const t = getTransporter();
    const from = process.env.SMTP_FROM || 'Reclamos Carmona <no-reply@carmona.local>';
    const cc = process.env.ALERTS_CC || undefined;

    if (!t) {
        console.warn('[mailer] SMTP no configurado — correo simulado:', { to: opts.to, subject: opts.subject });
        return;
    }

    await t.sendMail({ from, to: opts.to, cc, subject: opts.subject, html: opts.html });
}

export function slaAlertEmail(params: { code: string; customerName: string; daysWithoutManagement: number; url: string }) {
    return {
        subject: `⚠️ SLA vencido — Reclamo ${params.code} sin gestión hace ${params.daysWithoutManagement} días hábiles`,
        html: `
            <p>El reclamo <strong>${params.code}</strong> del cliente <strong>${params.customerName}</strong>
            lleva <strong>${params.daysWithoutManagement} días hábiles</strong> sin ninguna gestión registrada.</p>
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
