import { runSlaAlertCheck } from '@/lib/alerts';

/**
 * Disparado por Vercel Cron (ver vercel.json) — reemplaza al node-cron de
 * instrumentation.ts cuando se despliega en Vercel (sin proceso persistente
 * donde correr un scheduler in-process). Misma lógica que el autoalojado en
 * Cloudways: revisa reclamos abiertos y envía alertas de SLA vencido.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const result = await runSlaAlertCheck();
        return Response.json(result);
    } catch (err) {
        console.error('[cron/sla-check] error al ejecutar la revisión de SLA:', err);
        return Response.json({ error: 'internal error' }, { status: 500 });
    }
}
