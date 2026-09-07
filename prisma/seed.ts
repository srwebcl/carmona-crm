// Datos de ejemplo — reemplaza a src/data.ts del prototipo original.
// Ejecutar con: npm run db:seed
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? '1234'; // cambiar tras el primer login

const USERS = [
    { name: 'Admin General', email: 'admin@carmona.cl', role: 'Gerencia', brands: ['Todas'], areas: ['Todas'] },
    { name: 'Juanito Perez', email: 'juanito.perez@carmona.cl', role: 'Jefe Postventa', brands: ['Toyota'], areas: ['Servicio Técnico', 'Repuestos'] },
    { name: 'Juanita Contreras', email: 'juanita.contreras@carmona.cl', role: 'Jefe Ventas', brands: ['Toyota'], areas: ['Ventas'] },
    { name: 'Pepito', email: 'pepito@carmona.cl', role: 'Encargado Repuestos', brands: ['Todas'], areas: ['Repuestos'] },
    { name: 'Carlos Gomez', email: 'carlos.gomez@carmona.cl', role: 'Jefe Postventa', brands: ['Volkswagen', 'Volvo'], areas: ['Servicio Técnico'] },
];

async function main() {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    const createdUsers = [];
    for (const u of USERS) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: { ...u, passwordHash },
        });
        createdUsers.push(user);
    }

    const [admin, juanito, juanita] = createdUsers;

    const existingClaims = await prisma.claim.count();
    if (existingClaims === 0) {
        const claim1 = await prisma.claim.create({
            data: {
                code: 'REC-PENDIENTE',
                customerName: 'María González',
                email: 'maria@ejemplo.cl',
                phone: '+569 1234 5678',
                brand: 'Toyota',
                vehicleModel: 'Yaris',
                plate: 'ABCD12',
                eventDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                area: 'Servicio Técnico',
                description: 'Llevé mi Yaris a mantención y me lo entregaron con un rayón en la puerta derecha.',
                expectedSolution: 'Reparación del rayón sin costo.',
                channel: 'WEB',
                status: 'NUEVO',
                assignedToId: juanito.id,
            },
        });
        await prisma.claim.update({ where: { id: claim1.id }, data: { code: `REC-${1000 + claim1.id}` } });
        await prisma.claimHistory.create({
            data: { claimId: claim1.id, userId: null, authorName: 'Sistema', type: 'CREACION', text: 'Reclamo ingresado desde la web.' },
        });

        const claim2 = await prisma.claim.create({
            data: {
                code: 'REC-PENDIENTE',
                customerName: 'Pedro Soto',
                email: 'pedro.s@ejemplo.cl',
                phone: '+569 8765 4321',
                brand: 'Volkswagen',
                vehicleModel: 'Polo',
                plate: 'XY1122',
                eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                area: 'Ventas',
                description: 'El vendedor me prometió las alfombras gratis y no venían en la entrega del vehículo.',
                expectedSolution: 'Entrega de las alfombras prometidas.',
                channel: 'PHONE',
                status: 'EN_REVISION',
                assignedToId: admin.id,
            },
        });
        await prisma.claim.update({ where: { id: claim2.id }, data: { code: `REC-${1000 + claim2.id}` } });
        await prisma.claimHistory.createMany({
            data: [
                { claimId: claim2.id, userId: null, authorName: 'Sistema', type: 'CREACION', text: 'Reclamo ingresado telefónicamente.' },
                { claimId: claim2.id, userId: admin.id, authorName: admin.name, type: 'LLAMADA', text: 'Se contactó al vendedor para pedir explicaciones.' },
            ],
        });

        const claim3 = await prisma.claim.create({
            data: {
                code: 'REC-PENDIENTE',
                customerName: 'Luis Rodríguez',
                email: 'luis@ejemplo.cl',
                phone: '+569 1111 2222',
                brand: 'Toyota',
                vehicleModel: 'Hilux',
                plate: 'ZZ9988',
                eventDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                area: 'Ventas',
                description: 'No me han enviado la factura de la compra de mi camioneta Hilux.',
                expectedSolution: 'Envío de la factura por correo.',
                channel: 'WEB',
                status: 'RESUELTO',
                resolutionType: 'SE_ACOGE',
                closedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                assignedToId: juanita.id,
            },
        });
        await prisma.claim.update({ where: { id: claim3.id }, data: { code: `REC-${1000 + claim3.id}` } });
        await prisma.claimHistory.createMany({
            data: [
                { claimId: claim3.id, userId: null, authorName: 'Sistema', type: 'CREACION', text: 'Reclamo ingresado desde la web.' },
                { claimId: claim3.id, userId: juanita.id, authorName: juanita.name, type: 'CAMBIO_ESTADO', text: 'Estado cambiado de "EN_REVISION" a "RESUELTO" — Clasificación: Se acoge' },
            ],
        });
    }

    console.log(`Usuarios listos. Contraseña/PIN de todos: "${SEED_PASSWORD}" (cámbiala después del primer login).`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
