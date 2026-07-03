-- CreateTable votaciones
CREATE TABLE "votaciones" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "id_grupo"    UUID         NOT NULL,
    "id_deuda"    UUID         NOT NULL,
    "id_creador"  UUID         NOT NULL,
    "tipo"        VARCHAR(15)  NOT NULL,
    "estado"      VARCHAR(10)  NOT NULL DEFAULT 'activa',
    "resultado"   VARCHAR(10),
    "creado_en"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_en" TIMESTAMP(3),

    CONSTRAINT "votaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable votos_individuales
CREATE TABLE "votos_individuales" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "id_votacion"  UUID         NOT NULL,
    "id_usuario"   UUID         NOT NULL,
    "decision"     VARCHAR(10)  NOT NULL,
    "creado_en"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_individuales_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: un usuario vota solo una vez por votación
CREATE UNIQUE INDEX "votos_individuales_id_votacion_id_usuario_key"
    ON "votos_individuales"("id_votacion", "id_usuario");

-- Foreign Keys
ALTER TABLE "votaciones"
    ADD CONSTRAINT "votaciones_id_grupo_fkey"
    FOREIGN KEY ("id_grupo") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "votaciones"
    ADD CONSTRAINT "votaciones_id_deuda_fkey"
    FOREIGN KEY ("id_deuda") REFERENCES "deudas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "votaciones"
    ADD CONSTRAINT "votaciones_id_creador_fkey"
    FOREIGN KEY ("id_creador") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "votos_individuales"
    ADD CONSTRAINT "votos_individuales_id_votacion_fkey"
    FOREIGN KEY ("id_votacion") REFERENCES "votaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "votos_individuales"
    ADD CONSTRAINT "votos_individuales_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
