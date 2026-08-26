'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser, hashPassword } from '@/lib/auth';
import { userSchema } from '@/lib/validation';

export interface UserFormState {
    error?: string;
    success?: string;
}

/** Crea un perfil de usuario de gestión (nombre, correo corporativo, contraseña/PIN, marcas y áreas a cargo). Requisito 4. */
export async function createUserAction(_prevState: UserFormState, formData: FormData): Promise<UserFormState> {
    await requireUser();

    const parsed = userSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        password: formData.get('password'),
        brands: formData.getAll('brands'),
        areas: formData.getAll('areas'),
    });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return { error: 'Ya existe un usuario con ese correo corporativo.' };

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.create({
        data: {
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            passwordHash,
            brands: parsed.data.brands,
            areas: parsed.data.areas,
        },
    });

    revalidatePath('/equipo');
    return { success: 'Perfil creado correctamente.' };
}
