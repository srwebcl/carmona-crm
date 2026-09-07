// Next.js invoca `register()` una sola vez al levantar el servidor (dev y
// prod). Se usa para arrancar el cron de alertas de SLA sin depender de
// Vercel Cron — pero solo tiene sentido en un despliegue self-hosted
// (Cloudways) con proceso Node persistente. En Vercel las alertas las
// dispara app/api/cron/sla-check/route.ts vía Vercel Cron (ver vercel.json).
export async function register() {
    // Este hook corre también en el runtime "edge"; node-cron y Prisma
    // requieren Node.js, así que se ejecuta solo ahí.
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;

    // Vercel siempre define esta env var — sin proceso persistente, un
    // scheduler in-process no sobrevive entre invocaciones.
    if (process.env.VERCEL) return;

    const globalForCron = globalThis as unknown as { __slaCronStarted?: boolean };
    if (globalForCron.__slaCronStarted) return;
    globalForCron.__slaCronStarted = true;

    const cron = await import('node-cron');
    const { runSlaAlertCheck } = await import('./src/lib/alerts');

    // Todos los días hábiles a las 09:00. Ajustable con SLA_CRON_SCHEDULE.
    const schedule = process.env.SLA_CRON_SCHEDULE ?? '0 9 * * 1-5';

    cron.default.schedule(
        schedule,
        async () => {
            try {
                const result = await runSlaAlertCheck();
                console.log(`[sla-cron] revisados=${result.checked} alertas_enviadas=${result.alertsSent}`);
            } catch (err) {
                console.error('[sla-cron] error al ejecutar la revisión de SLA:', err);
            }
        },
        { timezone: process.env.SLA_CRON_TIMEZONE ?? 'America/Santiago' },
    );

    console.log(`[sla-cron] programado con schedule="${schedule}"`);
}
