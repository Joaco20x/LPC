-- CreateTable
CREATE TABLE "resumenes_mensuales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_grupo" UUID NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "total_gastos" DECIMAL(12,2) NOT NULL,
    "datos_json" JSONB NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumenes_mensuales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resumenes_mensuales_id_grupo_mes_anio_key" ON "resumenes_mensuales"("id_grupo", "mes", "anio");

-- AddForeignKey
ALTER TABLE "resumenes_mensuales" ADD CONSTRAINT "resumenes_mensuales_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
