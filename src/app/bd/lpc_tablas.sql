-- =========================================================
-- LPC — Script de creación de tablas
-- Base de datos: lpc_db
-- =========================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USUARIOS ──────────────────────────────────────────────
CREATE TABLE usuarios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              VARCHAR(100) NOT NULL,
  correo              VARCHAR(255) NOT NULL UNIQUE,
  contrasena_hash     TEXT,
  proveedor_oauth     VARCHAR(20),
  id_proveedor_oauth  VARCHAR(255),
  verificado          BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en           TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── TOKENS DE RECUPERACIÓN ────────────────────────────────
CREATE TABLE tokens_recuperacion (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expira_en   TIMESTAMP NOT NULL,
  usado       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── SESIONES (refresh tokens) ─────────────────────────────
CREATE TABLE sesiones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expira_en   TIMESTAMP NOT NULL,
  creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── GRUPOS DE VIAJE ───────────────────────────────────────
CREATE TABLE grupos (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                  VARCHAR(100) NOT NULL,
  destino                 VARCHAR(100) NOT NULL,
  fecha_inicio            DATE NOT NULL,
  fecha_fin               DATE NOT NULL,
  moneda_base             VARCHAR(10) NOT NULL DEFAULT 'CLP',
  presupuesto_por_persona NUMERIC(12,2),
  umbral_alerta           NUMERIC(5,2),
  estado                  VARCHAR(10) NOT NULL DEFAULT 'activo'
                            CHECK (estado IN ('activo', 'cerrado')),
  creado_en               TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── MIEMBROS DE GRUPO ─────────────────────────────────────
CREATE TABLE miembros_grupo (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_grupo    UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  id_usuario  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol         VARCHAR(10) NOT NULL DEFAULT 'miembro'
                CHECK (rol IN ('admin', 'miembro')),
  unido_en    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (id_grupo, id_usuario)
);

-- ── GASTOS ────────────────────────────────────────────────
CREATE TABLE gastos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_grupo     UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  id_pagador   UUID NOT NULL REFERENCES usuarios(id),
  monto        NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  descripcion  VARCHAR(255) NOT NULL,
  categoria    VARCHAR(50) NOT NULL,
  url_boleta   TEXT,
  creado_en    TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── DIVISIONES DE GASTO ───────────────────────────────────
CREATE TABLE divisiones_gasto (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_gasto        UUID NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
  id_usuario      UUID NOT NULL REFERENCES usuarios(id),
  monto_asignado  NUMERIC(12,2) NOT NULL CHECK (monto_asignado >= 0),
  tipo_division   VARCHAR(15) NOT NULL
                    CHECK (tipo_division IN ('equitativa', 'porcentual', 'manual')),
  UNIQUE (id_gasto, id_usuario)
);

-- ── DEUDAS ────────────────────────────────────────────────
CREATE TABLE deudas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_grupo      UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  id_deudor     UUID NOT NULL REFERENCES usuarios(id),
  id_acreedor   UUID NOT NULL REFERENCES usuarios(id),
  monto         NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  saldada       BOOLEAN NOT NULL DEFAULT FALSE,
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (id_deudor <> id_acreedor)
);

-- ── NOTIFICACIONES ────────────────────────────────────────
CREATE TABLE notificaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        VARCHAR(30) NOT NULL
                CHECK (tipo IN ('nuevo_gasto', 'pago', 'alerta_deuda')),
  metadata    JSONB NOT NULL DEFAULT '{}',
  leida       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── INVITACIONES ──────────────────────────────────────────
CREATE TABLE invitaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_grupo        UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  correo_invitado VARCHAR(255),
  token           TEXT NOT NULL UNIQUE,
  expira_en       TIMESTAMP NOT NULL,
  usado           BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── ÍNDICES ───────────────────────────────────────────────
CREATE INDEX idx_miembros_grupo_id_grupo   ON miembros_grupo(id_grupo);
CREATE INDEX idx_miembros_grupo_id_usuario ON miembros_grupo(id_usuario);
CREATE INDEX idx_gastos_id_grupo           ON gastos(id_grupo);
CREATE INDEX idx_divisiones_id_gasto       ON divisiones_gasto(id_gasto);
CREATE INDEX idx_deudas_id_deudor          ON deudas(id_deudor);
CREATE INDEX idx_deudas_id_acreedor        ON deudas(id_acreedor);
CREATE INDEX idx_notificaciones_id_usuario ON notificaciones(id_usuario);
CREATE INDEX idx_tokens_recuperacion_token ON tokens_recuperacion(token);
CREATE INDEX idx_sesiones_token_hash       ON sesiones(token_hash);

-- ── VERIFICACIÓN ──────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
