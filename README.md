# Carmona CRM — Gestión de Reclamos

Plataforma para centralizar, asignar y hacer seguimiento a los reclamos de clientes de Carmona (ingresados desde la web pública, por teléfono, presencial, etc.), con alertas automáticas de SLA y exportación de datos.

Stack: **Next.js 16** (App Router) + **TypeScript** + **Prisma** (PostgreSQL/Neon por defecto) + **Tailwind CSS 4**. Funciona tanto en **Vercel** (revisión rápida, este es el camino por defecto del repo) como autoalojado en un servidor propio como Cloudways (ver [Despliegue en Cloudways](#despliegue-en-cloudways-alternativa-self-hosted)).

## Requisitos

- Node.js `^20.19 || ^22.12 || >=24.0`
- Una base de datos PostgreSQL accesible (Neon, o MySQL/MariaDB si se autoaloja — ver más abajo)

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

## Motor de base de datos: PostgreSQL o MySQL

El schema (`prisma/schema.prisma`) usa `provider = "postgresql"` por defecto — es lo que permite desplegar en Vercel sin fricción (Neon vía Marketplace). Para autoalojar en Cloudways con MySQL/MariaDB en cambio:

1. Cambiar `provider = "mysql"` en `prisma/schema.prisma`.
2. Cambiar el paquete `@prisma/adapter-neon` por `@prisma/adapter-mariadb`, y en [src/lib/prisma.ts](src/lib/prisma.ts) y [prisma/seed.ts](prisma/seed.ts) cambiar `PrismaNeon` por `PrismaMariaDb` (mismo patrón: `new PrismaMariaDb(process.env.DATABASE_URL!)`).
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

## Despliegue en Vercel (por defecto)

Pensado para revisión rápida y también apto para producción liviana. Requiere tres piezas, todas provisionables desde el propio proyecto de Vercel:

1. **Base de datos**: Marketplace → Neon Postgres (`vercel integration add neon`). Provisiona `DATABASE_URL` automáticamente.
2. **Adjuntos**: `vercel blob store add` — provisiona `BLOB_READ_WRITE_TOKEN`. Con esa variable presente, [src/lib/uploads.ts](src/lib/uploads.ts) guarda los archivos ahí en vez de disco (en Vercel no hay disco persistente). Nota: los adjuntos quedan en una URL pública no adivinable, pero — a diferencia de la ruta propia `/uploads/[...path]` usada al autoalojar — no exigen sesión para abrirse.
3. **Variables propias** (`vercel env add <nombre> production`): `SESSION_SECRET`, `CRON_SECRET` (para `/api/cron/sla-check`, ver abajo), `SLA_BUSINESS_DAYS`, `APP_URL` (la URL del deployment). SMTP es opcional — sin `SMTP_HOST` el mailer solo deja log, no rompe nada.
4. Migrar y sembrar contra la BD de Vercel: `vercel env pull` (trae las env vars reales a `.env.local`) y luego `npm run db:migrate:deploy` + `npm run db:seed`.
5. Alertas de SLA: `vercel.json` define un cron (`0 12 * * 1-5`, ~9am Chile) que llama a `app/api/cron/sla-check/route.ts` — reemplaza al `node-cron` de `instrumentation.ts` (que se desactiva solo en Vercel, no hay proceso persistente donde correr un scheduler in-process).
6. Deploy: `vercel --prod`, o simplemente hacer push a `main` una vez conectado el repo de GitHub al proyecto (`vercel git connect`).

## Despliegue en Cloudways (alternativa self-hosted)

Requiere primero volver el schema a MySQL (ver [arriba](#motor-de-base-de-datos-postgresql-o-mysql)) si la cuenta no tiene Postgres.

1. En el servidor: Node.js app + base de datos MySQL/Postgres provisionadas.
2. Variables de entorno: las de `.env.example`, con `DATABASE_URL` apuntando a la BD de Cloudways, `SESSION_SECRET` único y largo, credenciales SMTP reales, y **`UPLOADS_DIR` como ruta absoluta persistente fuera de la carpeta del proyecto/build** (importante: el servidor `standalone` hace `chdir()` a `.next/standalone/` al arrancar, así que no puede depender de rutas relativas al cwd). Sin `BLOB_READ_WRITE_TOKEN`, los adjuntos usan automáticamente esta ruta en disco (ver [src/lib/uploads.ts](src/lib/uploads.ts)).
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
