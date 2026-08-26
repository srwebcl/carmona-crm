import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Nota: en Next.js 16 el proxy (ex-middleware) siempre corre en runtime
// Node.js — no hace falta (ni se permite) declarar `runtime` aquí.

// Rutas públicas: portal de ingreso de reclamos (requisito 2), login y salud.
const PUBLIC_PREFIXES = ['/login', '/reclamo', '/api/health'];

function isPublicPath(pathname: string) {
    // Los assets internos de Next (JS/CSS/fuentes) nunca deben pasar por el
    // chequeo de sesión — el `matcher` de abajo ya debería excluirlos, pero
    // se repite aquí como segunda barrera: si esto fallara, un asset
    // redirigido a /login (HTML) rompe la carga de la página con errores
    // "Unexpected token '<'" al intentar ejecutarlo como JS/CSS.
    if (pathname.startsWith('/_next/')) return true;

    return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Nota: el proxy (equivalente al antiguo middleware) no tiene acceso al
// contexto de request de next/headers, así que la cookie se lee vía
// `request.cookies` y se verifica solo la firma/expiración del JWT (rápido).
// La verificación autoritativa contra la base de datos (el usuario sigue
// existiendo, su rol vigente) ocurre en requireUser() dentro de cada
// página — esta es solo la primera barrera para no cargar páginas
// protegidas sin cookie de sesión válida.
async function hasValidSession(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get('session')?.value;
    if (!token) return false;

    const secret = process.env.SESSION_SECRET;
    if (!secret) return false;

    try {
        await jwtVerify(token, new TextEncoder().encode(secret));
        return true;
    } catch {
        return false;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    if (!(await hasValidSession(request))) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const proxyConfig = {
    matcher: [
        // Todas las rutas salvo assets internos de Next. /uploads/[...path]
        // (app/uploads/[...path]/route.ts) también exige sesión —esta es
        // una primera barrera, y la ruta además valida por su cuenta.
        '/((?!_next/static|_next/image|favicon.svg|icons.svg).*)',
    ],
};
