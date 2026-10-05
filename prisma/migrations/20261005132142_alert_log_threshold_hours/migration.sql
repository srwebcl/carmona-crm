-- Renombra el umbral de AlertLog de días a horas (el umbral de SLA pasó de
-- 5 días hábiles a 48 horas de reloj corrido). Las filas existentes se
-- retro-convierten (días * 24) para no perder el historial.
ALTER TABLE "alert_logs" ADD COLUMN "thresholdHours" INTEGER;

UPDATE "alert_logs" SET "thresholdHours" = "thresholdDays" * 24;

ALTER TABLE "alert_logs" ALTER COLUMN "thresholdHours" SET NOT NULL;

ALTER TABLE "alert_logs" DROP COLUMN "thresholdDays";
