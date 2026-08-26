import type { Metadata } from 'next';
import { ClaimForm } from '@/components/ClaimForm';
import { createClaimFromPublicForm } from '@/actions/claims';

export const metadata: Metadata = { title: 'Ingresar un Reclamo — Carmona' };

// Página pública (sin login) que Carmona puede enlazar/embeber desde su
// sitio web como el formulario oficial de reclamos (requisito 2).
export default function PublicClaimPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <ClaimForm
                action={createClaimFromPublicForm}
                title="Ingresa tu Reclamo"
                subtitle="Completa el siguiente formulario con el detalle de tu caso. Un ejecutivo del área correspondiente lo revisará a la brevedad."
                submitLabel="Enviar Reclamo"
            />
        </div>
    );
}
