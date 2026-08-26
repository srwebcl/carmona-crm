import type { Claim, User } from './types';

export const BRANDS = ['Toyota', 'Nissan', 'Ford', 'Chevrolet', 'Kia', 'Hyundai', 'Peugeot', 'Suzuki', 'Mazda', 'Honda'];
export const AREAS = ['Ventas', 'Servicio Técnico', 'Repuestos'];
export const STATUSES = ['Nuevo', 'En Revisión', 'Esperando Cliente', 'Resuelto', 'Cerrado'];

export const USERS: User[] = [
    { id: 1, name: 'Admin General', role: 'Gerencia', brands: ['Todas'], areas: ['Todas'] },
    { id: 2, name: 'Juanito Perez', role: 'Jefe Postventa', brands: ['Toyota'], areas: ['Servicio Técnico', 'Repuestos'] },
    { id: 3, name: 'Juanita Contreras', role: 'Jefe Ventas', brands: ['Toyota'], areas: ['Ventas'] },
    { id: 4, name: 'Pepito', role: 'Encargado Repuestos', brands: ['Todas'], areas: ['Repuestos'] },
    { id: 5, name: 'Carlos Gomez', role: 'Jefe Postventa', brands: ['Nissan', 'Ford'], areas: ['Servicio Técnico'] },
];

export const INITIAL_CLAIMS: Claim[] = [
    {
        id: 'REC-1001',
        customer: 'María Gonzalez',
        email: 'maria@ejemplo.cl',
        phone: '+569 1234 5678',
        brand: 'Toyota',
        area: 'Servicio Técnico',
        detail: 'Llevé mi Yaris a mantención y me lo entregaron con un rayón en la puerta derecha.',
        status: 'Nuevo',
        assignedTo: 'Juanito Perez',
        createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(),
        history: [
            { id: 1, date: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(), user: 'Sistema', type: 'Creación', text: 'Reclamo ingresado desde la web.' }
        ]
    },
    {
        id: 'REC-1002',
        customer: 'Pedro Soto',
        email: 'pedro.s@ejemplo.cl',
        phone: '+569 8765 4321',
        brand: 'Nissan',
        area: 'Ventas',
        detail: 'El vendedor me prometió las alfombras gratis y no venían en la entrega del vehículo.',
        status: 'En Revisión',
        assignedTo: 'Admin General',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        history: [
            { id: 1, date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), user: 'Sistema', type: 'Creación', text: 'Reclamo ingresado desde la web.' },
            { id: 2, date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), user: 'Admin General', type: 'Nota', text: 'Se contactó al vendedor para pedir explicaciones.' }
        ]
    },
    {
        id: 'REC-1003',
        customer: 'Luis Rodriguez',
        email: 'luis@ejemplo.cl',
        phone: '+569 1111 2222',
        brand: 'Toyota',
        area: 'Ventas',
        detail: 'No me han enviado la factura de la compra de mi camioneta Hilux.',
        status: 'Resuelto',
        assignedTo: 'Juanita Contreras',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        history: [
            { id: 1, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), user: 'Sistema', type: 'Creación', text: 'Reclamo ingresado desde la web.' },
            { id: 2, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), user: 'Juanita Contreras', type: 'Resolución', text: 'Factura enviada al correo del cliente.' }
        ]
    }
];
