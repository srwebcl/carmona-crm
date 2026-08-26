import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const COOKIE_NAME = 'session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 días

function getSecretKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 16) {
        throw new Error('SESSION_SECRET no está definido (o es muy corto) en las variables de entorno.');
    }
    return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}

/** Crea la cookie de sesión (JWT firmado) para el usuario recién autenticado. */
export async function createSession(userId: number) {
    const token = await new SignJWT({ sub: String(userId) })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
        .sign(getSecretKey());

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION_SECONDS,
    });
}

export async function destroySession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

/** Lee la cookie de sesión y devuelve el usuario actual, o null si no hay sesión válida. */
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        const userId = Number(payload.sub);
        if (!userId) return null;

        // Se consulta la BD en cada request (no se confía solo en el JWT) para
        // que un cambio de rol o la eliminación de un usuario tomen efecto
        // de inmediato, sin esperar a que expire la cookie.
        return await prisma.user.findUnique({ where: { id: userId } });
    } catch {
        return null;
    }
}

/** Igual que getCurrentUser, pero redirige a /login si no hay sesión. */
export async function requireUser() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');
    return user;
}
