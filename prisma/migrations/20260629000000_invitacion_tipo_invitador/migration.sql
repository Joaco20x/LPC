-- AlterTable: agregar tipo e id_invitador a invitaciones
ALTER TABLE "invitaciones" ADD COLUMN "tipo" VARCHAR(10) NOT NULL DEFAULT 'enlace';
ALTER TABLE "invitaciones" ADD COLUMN "id_invitador" UUID;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_id_invitador_fkey"
  FOREIGN KEY ("id_invitador") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
