import 'server-only';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// IMPORTANTE: no se puede derivar esta ruta de `process.cwd()`. El server.js
// del build "standalone" (el que se usa para desplegar en Cloudways) hace
// chdir() a su propia carpeta (.next/standalone) al arrancar — si los
// adjuntos se guardaran ahí, desaparecerían en cada `next build` nuevo. Por
// eso la ubicación es explícita vía UPLOADS_DIR (ruta absoluta, fuera del
// directorio de build) y se sirven mediante app/uploads/[...path]/route.ts
// en lugar de la carpeta estática `public/`.
function getUploadsRoot(): string {
    const configured = process.env.UPLOADS_DIR;
    if (configured) return configured;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('UPLOADS_DIR no está definida. En producción debe apuntar a una ruta absoluta persistente fuera del build (ver .env.example).');
    }
    // Solo para desarrollo local: carpeta en la raíz del proyecto (gitignored).
    return path.join(process.cwd(), 'uploads-dev');
}

export interface SavedFile {
    filename: string;
    path: string; // ruta lógica servida por app/uploads/[...path]/route.ts, ej. /uploads/12/uuid-nombre.pdf
    size: number;
    mimeType: string;
}

/**
 * Guarda los archivos adjuntos de un `FormData` en disco, bajo
 * UPLOADS_DIR/<claimId>/, y devuelve su metadata para persistir en la tabla
 * Attachment. Requiere disco persistente (Cloudways) — no funciona en
 * plataformas serverless con filesystem efímero.
 */
export async function saveUploadedFiles(files: File[], claimId: number): Promise<SavedFile[]> {
    if (files.length === 0) return [];

    // UPLOADS_DIR es una ruta fuera del proyecto a propósito (ver nota más
    // arriba) — se opta explícitamente fuera del tracing de Turbopack en
    // vez de dejar que intente empaquetar todo el filesystem del proyecto.
    const dir = path.join(/*turbopackIgnore: true*/ getUploadsRoot(), String(claimId));
    await mkdir(dir, { recursive: true });

    const saved: SavedFile[] = [];
    for (const file of files) {
        if (!file || file.size === 0) continue;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const diskName = `${randomUUID()}-${safeName}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(dir, diskName), buffer);

        saved.push({
            filename: file.name,
            path: `/uploads/${claimId}/${diskName}`,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
        });
    }
    return saved;
}

/** Extrae los File válidos (no vacíos) de una entrada repetida de FormData. */
export function collectFiles(formData: FormData, fieldName: string): File[] {
    return formData
        .getAll(fieldName)
        .filter((v): v is File => v instanceof File && v.size > 0);
}

/**
 * Resuelve de forma segura un path público (ej. "12/uuid-nombre.pdf") a su
 * ruta absoluta en disco, evitando path traversal. Devuelve null si el
 * resultado queda fuera de UPLOADS_DIR.
 */
export function resolveUploadPath(segments: string[]): string | null {
    const root = getUploadsRoot();
    const target = path.join(/*turbopackIgnore: true*/ root, ...segments);
    if (target !== root && !target.startsWith(root + path.sep)) return null;
    return target;
}
