# Carmona CRM — Gestión de Reclamos

Plataforma para centralizar, asignar y hacer seguimiento a los reclamos de clientes de Carmona (ingresados desde la web pública, por teléfono, presencial, etc.), con alertas automáticas de SLA y exportación de datos.

Stack: **Next.js 16** (App Router) + **TypeScript** + **Prisma** (MySQL/MariaDB) + **Tailwind CSS 4**. Pensado para autoalojarse en un servidor propio (Cloudways) — no depende de Vercel.

## Requisitos

- Node.js `^20.19 || ^22.12 || >=24.0`
- Una base de datos MySQL/MariaDB accesible (o PostgreSQL, ver más abajo)

## Desarrollo local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar `.env.example` a `.env` y completar los valores (base de datos, `SESSION_SECRET`, SMTP, `UPLOADS_DIR`). Ver el detalle de cada variable en los comentarios del propio archivo.
3. Aplicar el schema a la base de datos y cargar datos de ejemplo:
   ```bash
   npm run db:migrate   # crea las tablas
   npm run db:seed      # crea usuarios de ejemplo y 3 reclamos de muestra
   ```
   El seed imprime la contraseña/PIN de los usuarios de ejemplo (por defecto `1234`, cambiable con `SEED_PASSWORD`). Usuario admin: `admin@carmona.cl`.
4. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   App en `http://localhost:3000`. Portal público de reclamos en `/reclamo` (sin login).

## Motor de base de datos: MySQL o PostgreSQL

El schema (`prisma/schema.prisma`) usa `provider = "mysql"` por defecto (lo más común en Cloudways). Si la cuenta termina siendo Postgres:

1. Cambiar `provider = "postgresql"` en `prisma/schema.prisma`.
2. Reemplazar el paquete `@prisma/adapter-mariadb` por `@prisma/adapter-pg`, y en [src/lib/prisma.ts](src/lib/prisma.ts) y [prisma/seed.ts](prisma/seed.ts) cambiar `PrismaMariaDb` por `PrismaPg` (mismo patrón, ver la doc de cada adapter).
3. Correr `npm run db:migrate` de nuevo.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (salida `standalone`) |
| `npm start` | Sirve el build (**usar el server standalone real en producción**, ver despliegue) |
| `npm run db:migrate` | Aplica migraciones en desarrollo (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | Aplica migraciones en producción (`prisma migrate deploy`) |
| `npm run db:seed` | Carga usuarios y reclamos de ejemplo |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar la base de datos |
| `npm run lint` | Lint con oxlint |

## Despliegue en Cloudways

1. En el servidor: Node.js app + base de datos MySQL/Postgres provisionadas.
2. Variables de entorno: las de `.env.example`, con `DATABASE_URL` apuntando a la BD de Cloudways, `SESSION_SECRET` único y largo, credenciales SMTP reales, y **`UPLOADS_DIR` como ruta absoluta persistente fuera de la carpeta del proyecto/build** (importante: el servidor `standalone` hace `chdir()` a `.next/standalone/` al arrancar, así que no puede depender de rutas relativas al cwd).
3. Build y arranque:
   ```bash
   npm run build
   npm run db:migrate:deploy
   cp -r public .next/standalone/public
   cp -r .next/static .next/standalone/.next/static
   node .next/standalone/server.js
   ```
   (`npm start`/`next start` avisa que no sirve del todo con `output: standalone` — en producción usar siempre `node .next/standalone/server.js` como arriba, gestionado con PM2 o el manejador de procesos de Cloudways.)
4. El cron de alertas de SLA (5 días hábiles sin gestión por defecto, ver `SLA_BUSINESS_DAYS`) se arranca solo dentro del propio proceso Node (`instrumentation.ts`, vía `node-cron`) — no requiere cron a nivel de sistema operativo, pero si se corre más de una instancia del proceso, revisar que no se dupliquen los envíos (hoy previene reenvíos el mismo día vía `AlertLog`, no entre instancias simultáneas).
5. Endpoint de salud para el balanceador/monitoreo: `GET /api/health`.

## Estructura

- `app/` — rutas (App Router). `app/(app)/` son las páginas internas protegidas (dashboard, reclamos, equipo); `app/reclamo/` y `app/login/` son públicas.
- `src/actions/` — Server Actions (mutaciones: crear reclamo, cambiar estado, reasignar, crear usuario, login).
- `src/lib/` — Prisma client, autenticación (sesión propia con cookie firmada + bcrypt), reglas de enrutamiento automático, cálculo de días hábiles, envío de correo, exportación CSV, manejo de adjuntos.
- `src/components/` — UI (mismo diseño visual del prototipo original, adaptado a Server/Client Components).
- `prisma/schema.prisma` — modelo de datos. `prisma/seed.ts` — datos de ejemplo.
- `proxy.ts` — protección de rutas (reemplaza al histórico `middleware.ts` en Next.js 16).

## Notas de seguridad

- Contraseñas/PIN de usuario se guardan hasheadas (bcrypt), nunca en texto plano.
- Sesión vía cookie `httpOnly` firmada (JWT), sin dependencias externas de autenticación.
- Los adjuntos de reclamos requieren sesión para descargarse (no son archivos públicos).
