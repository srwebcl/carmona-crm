import Image from 'next/image';
import clsx from 'clsx';

const NATIVE_WIDTH = 256;
const NATIVE_HEIGHT = 42;

/**
 * Logo oficial de Carmona (blanco, con transparencia) — pensado para fondos
 * oscuros. En fondos claros se envuelve en un contenedor oscuro (`dark`)
 * para que siga siendo legible sin alterar el archivo original.
 */
export function Logo({ width = 160, dark = false, className }: { width?: number; dark?: boolean; className?: string }) {
    const height = Math.round((width * NATIVE_HEIGHT) / NATIVE_WIDTH);
    const img = (
        <Image
            src="/logo-carmona.avif"
            alt="Carmona"
            width={NATIVE_WIDTH}
            height={NATIVE_HEIGHT}
            style={{ width, height }}
            priority
            // El optimizador de imágenes de Next (sharp) no logra procesar
            // este AVIF ("isn't a valid image"), aunque el archivo es válido
            // (decodifica bien en el navegador y en herramientas nativas).
            // Se sirve tal cual, sin pasar por esa optimización.
            unoptimized
        />
    );

    if (!dark) return <span className={className}>{img}</span>;

    return (
        <span className={clsx('inline-flex items-center justify-center bg-slate-900 rounded-2xl px-6 py-4', className)}>
            {img}
        </span>
    );
}
