import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { requireUser } from '@/lib/auth';
import { resolveUploadPath } from '@/lib/uploads';

const MIME_BY_EXT: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Sirve los adjuntos de reclamos (requiere sesión — pueden contener datos de
 * clientes). Se guardan fuera de `public/` porque el build "standalone" de
 * Cloudways hace chdir() a su propia carpeta; ver src/lib/uploads.ts.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    await requireUser();

    const { path: segments } = await params;
    const filePath = resolveUploadPath(segments);
    if (!filePath) return new Response('Not found', { status: 404 });

    try {
        const stats = await stat(filePath);
        if (!stats.isFile()) return new Response('Not found', { status: 404 });

        const buffer = await readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_BY_EXT[ext] ?? 'application/octet-stream';

        return new Response(new Uint8Array(buffer), {
            headers: {
                'Content-Type': mimeType,
                'Content-Length': String(stats.size),
                'Cache-Control': 'private, max-age=31536000, immutable',
            },
        });
    } catch {
        return new Response('Not found', { status: 404 });
    }
}
