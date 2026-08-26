import { ClaimForm } from '@/components/ClaimForm';
import { createClaimManual } from '@/actions/claims';

// Ingreso manual por un administrador/jefatura, para reclamos que llegan por
// otros canales (teléfono, presencial, redes) y se centralizan aquí (requisito 3).
export default function NewManualClaimPage() {
    return (
        <ClaimForm
            action={createClaimManual}
            isManual
            title="Ingresar Reclamo Manualmente"
            subtitle="Usa este formulario para centralizar un reclamo recibido por otro canal (teléfono, presencial, redes sociales, etc)."
            submitLabel="Registrar Reclamo"
        />
    );
}
