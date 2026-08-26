'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createSession, destroySession, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';

export interface LoginState {
    error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return { error: 'Correo o contraseña/PIN incorrectos.' };

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return { error: 'Correo o contraseña/PIN incorrectos.' };

    await createSession(user.id);

    const next = formData.get('next');
    const destination = typeof next === 'string' && next.startsWith('/') ? next : '/';
    redirect(destination);
}

export async function logoutAction() {
    await destroySession();
    redirect('/login');
}
