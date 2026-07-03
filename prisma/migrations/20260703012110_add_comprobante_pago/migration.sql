-- AlterTable
ALTER TABLE "deudas" ADD COLUMN     "estado" VARCHAR(30) NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "pagada_en" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "comprobantes_pago" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_deuda" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "url_archivo" VARCHAR(500) NOT NULL,
    "tipo_archivo" VARCHAR(50) NOT NULL,
    "rut" VARCHAR(20) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "aceptado_en" TIMESTAMP(3),
    "rechazado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprobantes_pago_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "comprobantes_pago" ADD CONSTRAINT "comprobantes_pago_id_deuda_fkey" FOREIGN KEY ("id_deuda") REFERENCES "deudas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_pago" ADD CONSTRAINT "comprobantes_pago_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
