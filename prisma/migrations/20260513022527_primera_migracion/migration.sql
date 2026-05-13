-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(255) NOT NULL,
    "contrasena_hash" TEXT,
    "proveedor_oauth" VARCHAR(20),
    "id_proveedor_oauth" VARCHAR(255),
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_recuperacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "destino" VARCHAR(100) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "moneda_base" VARCHAR(10) NOT NULL DEFAULT 'CLP',
    "presupuesto_por_persona" DECIMAL(12,2),
    "umbral_alerta" DECIMAL(5,2),
    "estado" VARCHAR(10) NOT NULL DEFAULT 'activo',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miembros_grupo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_grupo" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "rol" VARCHAR(10) NOT NULL DEFAULT 'miembro',
    "unido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "miembros_grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_grupo" UUID NOT NULL,
    "id_pagador" UUID NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "url_boleta" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisiones_gasto" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_gasto" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "monto_asignado" DECIMAL(12,2) NOT NULL,
    "tipo_division" VARCHAR(15) NOT NULL,

    CONSTRAINT "divisiones_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deudas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_grupo" UUID NOT NULL,
    "id_deudor" UUID NOT NULL,
    "id_acreedor" UUID NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "saldada" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deudas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_grupo" UUID NOT NULL,
    "correo_invitado" VARCHAR(255),
    "token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacion_token_key" ON "tokens_recuperacion"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_token_hash_key" ON "sesiones"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "miembros_grupo_id_grupo_id_usuario_key" ON "miembros_grupo"("id_grupo", "id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "divisiones_gasto_id_gasto_id_usuario_key" ON "divisiones_gasto"("id_gasto", "id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_token_key" ON "invitaciones"("token");

-- AddForeignKey
ALTER TABLE "tokens_recuperacion" ADD CONSTRAINT "tokens_recuperacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_grupo" ADD CONSTRAINT "miembros_grupo_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_grupo" ADD CONSTRAINT "miembros_grupo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_pagador_fkey" FOREIGN KEY ("id_pagador") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisiones_gasto" ADD CONSTRAINT "divisiones_gasto_id_gasto_fkey" FOREIGN KEY ("id_gasto") REFERENCES "gastos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisiones_gasto" ADD CONSTRAINT "divisiones_gasto_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deudas" ADD CONSTRAINT "deudas_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deudas" ADD CONSTRAINT "deudas_id_deudor_fkey" FOREIGN KEY ("id_deudor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deudas" ADD CONSTRAINT "deudas_id_acreedor_fkey" FOREIGN KEY ("id_acreedor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
