import { NextResponse } from 'next/server';
import { claimFieldsSchema } from '@/lib/validation';
import { createClaim, attachFiles } from '@/lib/claimCreation';
import { collectFiles } from '@/lib/uploads';

/**
 * Endpoint público (sin sesión) para que el sitio de Automotriz Carmona
 * (www.automotrizcarmona.cl/reclamos, con su propio formulario y diseño)
 * cree reclamos directamente en este CRM, vía fetch cross-origin.
 * Hace exactamente lo mismo que el formulario público embebido en
 * /reclamo — misma validación, mismo enrutamiento automático.
 */
const ALLOWED_ORIGINS = ['https://www.automotrizcarmona.cl', 'https://automotrizcarmona.cl'];

function corsHeaders(origin: string | null): HeadersInit {
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS(request: Request) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: Request) {
    const headers = corsHeaders(request.headers.get('origin'));

    try {
        const formData = await request.formData();
        const parsed = claimFieldsSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' },
                { status: 400, headers },
            );
        }

        const createdByName = 'Cliente (sitio web Carmona)';
        const claim = await createClaim({ ...parsed.data, channel: 'WEB', createdByName });

        const files = collectFiles(formData, 'attachments');
        await attachFiles(files, claim.id, createdByName);

        return NextResponse.json({ success: true, code: claim.code }, { headers });
    } catch (err) {
        console.error('[api/public/claims] error creando reclamo:', err);
        return NextResponse.json(
            { success: false, error: 'No pudimos registrar tu reclamo. Por favor intenta más tarde.' },
            { status: 500, headers },
        );
    }
}
