import { IframeHeightReporter } from '@/components/IframeHeightReporter';

export default function ReclamoLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <IframeHeightReporter />
            {children}
        </>
    );
}
