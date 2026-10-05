/*
  Agrega RUT, sucursal y solución definitiva a los reclamos; marca/modelo/
  patente pasan a ser opcionales (reclamos sin vehículo); agrega sucursales
  a los perfiles de usuario; agrega quién subió cada adjunto.

  Como ya hay filas reales (reclamos y adjuntos cargados por el cliente
  durante la revisión), las columnas nuevas obligatorias se agregan primero
  como nullable, se rellenan con un valor placeholder razonable, y recién
  ahí se marcan NOT NULL — evita romper los datos existentes.
*/

-- AlterTable: claims
ALTER TABLE "claims" ADD COLUMN     "branch" TEXT,
ADD COLUMN     "resolutionNotes" TEXT,
ADD COLUMN     "rut" TEXT,
ALTER COLUMN "brand" DROP NOT NULL,
ALTER COLUMN "vehicleModel" DROP NOT NULL,
ALTER COLUMN "plate" DROP NOT NULL;

-- Backfill de filas existentes con un placeholder (no hay forma de saber el
-- RUT/sucursal real de reclamos ya ingresados antes de este cambio).
UPDATE "claims" SET "branch" = 'La Serena' WHERE "branch" IS NULL;
UPDATE "claims" SET "rut" = '11.111.111-1' WHERE "rut" IS NULL;

ALTER TABLE "claims" ALTER COLUMN "branch" SET NOT NULL,
ALTER COLUMN "rut" SET NOT NULL;

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN     "branches" JSONB NOT NULL DEFAULT '["Todas"]';

-- AlterTable: attachments
ALTER TABLE "attachments" ADD COLUMN     "uploadedByName" TEXT;

-- Backfill: para adjuntos de la bitácora, el autor de esa entrada de
-- historial; para los de la creación del reclamo (historyId null), un
-- placeholder genérico.
UPDATE "attachments" a
SET "uploadedByName" = ch."authorName"
FROM "claim_history" ch
WHERE a."historyId" = ch."id" AND a."uploadedByName" IS NULL;

UPDATE "attachments" SET "uploadedByName" = 'Cliente' WHERE "uploadedByName" IS NULL;

ALTER TABLE "attachments" ALTER COLUMN "uploadedByName" SET NOT NULL;

-- CreateIndex
CREATE INDEX "claims_area_idx" ON "claims"("area");

-- CreateIndex
CREATE INDEX "claims_branch_idx" ON "claims"("branch");
