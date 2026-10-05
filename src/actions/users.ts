'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser, hashPassword } from '@/lib/auth';
import { userSchema, updateUserSchema } from '@/lib/validation';

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
        branches: formData.getAll('branches'),
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
            branches: parsed.data.branches,
        },
    });

    revalidatePath('/equipo');
    return { success: 'Perfil creado correctamente.' };
}

/** Edita un perfil existente. La contraseña/PIN solo se actualiza si se ingresa una nueva. */
export async function updateUserAction(_prevState: UserFormState, formData: FormData): Promise<UserFormState> {
    await requireUser();

    const id = Number(formData.get('id'));
    if (!id) return { error: 'Perfil inválido.' };

    const parsed = updateUserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        password: formData.get('password') || undefined,
        brands: formData.getAll('brands'),
        areas: formData.getAll('areas'),
        branches: formData.getAll('branches'),
    });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing && existing.id !== id) return { error: 'Ya existe un usuario con ese correo corporativo.' };

    await prisma.user.update({
        where: { id },
        data: {
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            brands: parsed.data.brands,
            areas: parsed.data.areas,
            branches: parsed.data.branches,
            ...(parsed.data.password ? { passwordHash: await hashPassword(parsed.data.password) } : {}),
        },
    });

    revalidatePath('/equipo');
    return { success: 'Perfil actualizado correctamente.' };
}

export interface DeleteUserState {
    error?: string;
}

/**
 * Elimina un perfil. Se bloquea si el perfil sigue a cargo de algún reclamo
 * (Claim.assignedToId es obligatorio en la base — eliminarlo igual rompería
 * esos reclamos) o si es el propio usuario de la sesión actual.
 */
export async function deleteUserAction(_prevState: DeleteUserState, formData: FormData): Promise<DeleteUserState> {
    const currentUser = await requireUser();

    const id = Number(formData.get('id'));
    if (!id) return { error: 'Perfil inválido.' };

    if (id === currentUser.id) {
        return { error: 'No puedes eliminar tu propio perfil mientras tienes la sesión abierta.' };
    }

    const assignedCount = await prisma.claim.count({ where: { assignedToId: id } });
    if (assignedCount > 0) {
        return { error: `Este perfil sigue a cargo de ${assignedCount} reclamo(s). Reasígnalos a otro responsable antes de eliminarlo.` };
    }

    await prisma.user.delete({ where: { id } });

    revalidatePath('/equipo');
    return {};
}
