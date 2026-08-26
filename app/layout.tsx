import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-sans',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Carmona CRM - Portal',
    description: 'Plataforma de gestión de reclamos Carmona',
    icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={inter.variable}>
            <body className="antialiased">{children}</body>
        </html>
    );
}
