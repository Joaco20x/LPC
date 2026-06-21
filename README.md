# LPC — Guía de Configuración del Entorno

> **Plataforma de Gestión de Gastos de Viaje**  
> Universidad Católica de Temuco · Diseño de Software · 2025  
> Equipo: Joaquín Valenzuela, Martin López, Vicente Santin, Deris Aránguiz, Bastián Liempi

---

## Requisitos previos

Antes de comenzar asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/download/) v14 o superior
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) (recomendado)

---

## 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd eatryp
```

---

## 2. Instalar dependencias

```bash
npm install
```

---

## 3. Configurar la base de datos local

Cada integrante debe crear su propia base de datos local. Esto permite trabajar de forma independiente sin afectar el entorno de los demás.

### 3.1 Conectarse a PostgreSQL

Abre una terminal y ejecuta:

```bash
psql -U postgres
```

Te pedirá la contraseña de tu usuario `postgres` (la que definiste al instalar PostgreSQL).

### 3.2 Crear la base de datos

Una vez dentro de `psql`:

```sql
CREATE DATABASE lpc_db;
```

Verifica que se creó correctamente:

```bash
\l
```

Deberías ver `lpc_db` en la lista. Luego sal:

```bash
\q
```

---

## 4. Configurar Prisma

El proyecto usa **Prisma** como ORM para interactuar con la base de datos. Sigue estos pasos después de crear la base de datos.

### 4.1 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Base de datos (requerida por Prisma)
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/lpc_db

# JWT
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
JWT_EXPIRACION=1h
JWT_REFRESH_EXPIRACION=7d

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

> ⚠️ **Importante:** Reemplaza `TU_CONTRASEÑA` con la contraseña de tu usuario `postgres`.  
> ⚠️ **Nunca subas `.env` al repositorio.** Ya está incluido en `.gitignore`.

### 4.2 Aplicar las migraciones

Con Prisma, las tablas se crean y sincronizan a través de migraciones, **no** ejecutando el script SQL directamente. Desde la raíz del proyecto ejecuta:

```bash
npx prisma migrate dev
```

Esto creará todas las tablas definidas en el schema de Prisma en tu base de datos local. Si es la primera vez, puede pedirte un nombre para la migración inicial.

### 4.3 Verificar el schema (opcional)

Para abrir Prisma Studio y explorar los datos visualmente:

```bash
npx prisma studio
```

Se abrirá en [http://localhost:5555](http://localhost:5555).

### 4.4 Regenerar el cliente Prisma

Si alguien del equipo modifica el archivo `prisma/schema.prisma`, debes regenerar el cliente local:

```bash
npx prisma generate
```

---

## 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 6. Rutas disponibles

| Ruta | Descripción |
|------|-------------|
| `localhost:3000/` | Página principal |
| `localhost:3000/login` | Inicio de sesión |
| `localhost:3000/registro` | Crear cuenta |
| `localhost:3000/recuperar-contrasena` | Recuperar contraseña |
| `localhost:3000/nueva-contrasena` | Establecer nueva contraseña |
| `localhost:3000/dashboard` | Panel principal (requiere sesión) |
| `localhost:3000/grupos/crear` | Crear grupo de viaje |
| `localhost:3000/gastos` | Gestión de gastos |
| `localhost:3000/deudas` | Liquidación de deudas |
| `localhost:3000/auth/google/callback` | Callback intermedio OAuth Google |

---

## 7. Arquitectura del proyecto

El proyecto sigue una **Arquitectura basada en Dominios (Domain-Driven Design ligero)**, donde cada módulo de negocio (auth, grupos, gastos, deudas) agrupa su propia capa técnica (controlador, servicio, repositorio, tipos, validaciones). Esto mantiene el código cohesivo y facilita escalar funcionalidades sin acoplar módulos.

```
Petición HTTP
     │
     ▼
app/api/auth/login/route.ts   ← Solo recibe la petición y delega al controlador del dominio
     │
     ▼
auth/controllers/login.controller.ts  ← Valida la petición, maneja cookies y retorna la respuesta HTTP
     │
     ▼
auth/services/login.service.ts       ← Lógica de negocio (bcrypt, JWT)
     │
     ▼
auth/repositories/PrismaUsuarioRepository.ts  ← Consultas a la base de datos via Prisma
     │
     ▼
shared/libs/prisma.ts              ← Cliente Prisma singleton
```

**Reglas de la arquitectura por dominio:**

- **`app/api/*/route.ts`** — Recibe la petición HTTP y delega al controlador del dominio. Sin lógica propia.
- **`*/controllers/*.controller.ts`** — Valida la petición, maneja cookies/respuestas HTTP. No accede a BD directamente.
- **`*/services/*.service.ts`** — Lógica de negocio (JWT, bcrypt, cálculos). Sin conocimiento HTTP.
- **`*/repositories/*Repository.ts`** — Interfaz e implementación Prisma para acceso a datos.
- **`*/types/*.ts`** — Interfaces TypeScript del dominio.
- **`*/validaciones/*.ts`** — Validaciones de formulario del lado cliente.

Los dominios NO se importan entre sí; la comunicación entre dominios se hace a través del contenedor DI (`shared/di/crearDependencias.ts`). El dominio `shared/` contiene utilidades transversales (cliente Prisma, DI, almacenamiento de tokens en cliente).

---

## 8. Estructura del proyecto

```
eatryp/
├── src/
│   ├── app/                              # Next.js App Router (UI + API)
│   │   ├── layout.tsx                    # Layout raíz (html + body)
│   │   ├── page.tsx                      # Landing principal
│   │   ├── globals.css
│   │   ├── landing.css
│   │   ├── (auth)/                       # Grupo de rutas público (sin sesión)
│   │   │   ├── layout.tsx
│   │   │   ├── auth.css
│   │   │   ├── login/page.tsx
│   │   │   ├── registro/page.tsx
│   │   │   ├── recuperar-contrasena/page.tsx
│   │   │   └── nueva-contrasena/page.tsx
│   │   ├── (dashboard)/                  # Grupo de rutas protegidas (con sesión)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── gastos/page.tsx
│   │   │   ├── deudas/page.tsx
│   │   │   ├── grupos/crear/page.tsx
│   │   │   └── grupos/[id]/page.tsx
│   │   ├── api/                          # API routes (delegan a controladores por dominio)
│   │   │   ├── auth/login/route.ts
│   │   │   ├── auth/registro/route.ts
│   │   │   ├── auth/logout/route.ts
│   │   │   ├── auth/refresh/route.ts
│   │   │   ├── auth/recuperar-contrasena/route.ts
│   │   │   ├── auth/nueva-contrasena/route.ts
│   │   │   ├── auth/usuarios/buscar/route.ts
│   │   │   ├── auth/google/iniciar/route.ts
│   │   │   ├── auth/google/callback/route.ts
│   │   │   ├── grupos/route.ts
│   │   │   ├── grupos/[id]/route.ts
│   │   │   ├── gastos/route.ts
│   │   │   ├── gastos/opciones/route.ts
│   │   │   └── deudas/route.ts
│   │   ├── auth/google/callback/         # Página intermedia OAuth
│   │   │   └── page.tsx
│   │   └── api-doc/                      # Documentación Swagger
│   │       ├── page.tsx
│   │       └── json/route.ts
│   │
│   ├── auth/                             # Dominio: Autenticación y Usuarios
│   │   ├── controllers/
│   │   │   ├── login.controller.ts
│   │   │   ├── registro.controller.ts
│   │   │   ├── logout.controller.ts
│   │   │   ├── refresh.controller.ts
│   │   │   ├── recuperar.controller.ts
│   │   │   ├── nueva-contrasena.controller.ts
│   │   │   ├── usuarios.controller.ts
│   │   │   └── google.oauth.controller.ts
│   │   ├── services/
│   │   │   ├── login.service.ts
│   │   │   ├── registro.service.ts
│   │   │   ├── logout.service.ts
│   │   │   ├── refresh.service.ts
│   │   │   ├── recuperar.service.ts
│   │   │   ├── nueva-contrasena.service.ts
│   │   │   ├── jwt.ts                    # Helpers JWT
│   │   │   ├── contraseña.ts             # Helpers bcrypt
│   │   │   └── google.service.ts         # OAuth Google
│   │   ├── repositories/
│   │   │   ├── IUsuarioRepository.ts
│   │   │   ├── PrismaUsuarioRepository.ts
│   │   │   ├── ISesionRepository.ts
│   │   │   ├── PrismaSesionRepository.ts
│   │   │   ├── ITokenRecuperacionRepository.ts
│   │   │   └── PrismaTokenRecuperacionRepository.ts
│   │   ├── components/
│   │   │   ├── BotonOAuth.tsx
│   │   │   ├── CampoEntrada.tsx
│   │   │   └── Separador.tsx
│   │   ├── types/
│   │   │   └── autenticacion.ts
│   │   ├── validaciones/
│   │   │   ├── autenticacion.ts
│   │   │   └── useFormulario.ts
│   │
│   ├── grupos/                           # Dominio: Grupos de Viaje
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── components/
│   │   ├── types/
│   │   ├── validaciones/
│   │   └── api/
│   │
│   ├── gastos/                           # Dominio: Gastos
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── components/
│   │   ├── types/
│   │   ├── validaciones/
│   │   └── api/
│   │
│   ├── deudas/                           # Dominio: Deudas
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── components/
│   │   ├── types/
│   │   └── api/
│   │
│   ├── notificaciones/                   # Dominio: Notificaciones (pendiente)
│   │   ├── services/
│   │   ├── types/
│   │   └── api/
│   │
│   ├── admin/                            # Dominio: Admin (pendiente)
│   │   ├── controllers/
│   │   └── services/
│   │
│   ├── shared/                           # Utilidades transversales
│   │   ├── di/crearDependencias.ts       # Contenedor DI
│   │   ├── libs/prisma.ts                # Cliente Prisma singleton
│   │   ├── servicios/almacenamientoTokens.ts  # Gestión de tokens en cliente
│   │   └── types/
│
└── prisma/                              # ORM — esquema y migraciones
    └── schema.prisma                     # Schema de la base de datos
```

---

## 9. Tablas de la base de datos

Definidas en `prisma/schema.prisma` y gestionadas a través de migraciones Prisma.

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Datos de usuarios registrados |
| `tokens_recuperacion` | Tokens para restablecer contraseña |
| `sesiones` | Refresh tokens de sesión JWT |
| `grupos` | Grupos de viaje |
| `miembros_grupo` | Relación usuario–grupo con rol (admin/miembro) |
| `gastos` | Gastos registrados dentro de un grupo |
| `divisiones_gasto` | Cómo se divide cada gasto entre integrantes |
| `deudas` | Deudas calculadas entre integrantes |
| `notificaciones` | Notificaciones del sistema (JSONB) |
| `invitaciones` | Invitaciones a grupos por correo o token |

---

## 10. Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| Next.js 16 + TypeScript | Framework principal (SSR + App Router) |
| React 19 | Interfaz de usuario |
| PostgreSQL | Base de datos relacional |
| Prisma | ORM: migraciones, cliente tipado y consultas |
| bcrypt | Encriptación de contraseñas |
| JWT | Autenticación con tokens |
| Tailwind CSS v4 | Estilos utilitarios |

---

## 11. Problemas frecuentes

**Error: `psql` no se reconoce como comando**  
Agrega PostgreSQL al PATH de Windows. Busca la carpeta `bin` de tu instalación (ej: `C:\Program Files\PostgreSQL\16\bin`) y agrégala a las variables de entorno.

**Error al conectar a la base de datos**  
Verifica que el servicio de PostgreSQL esté corriendo. En Windows: `Servicios → postgresql-x64-XX → Iniciar`.

**Error en `prisma migrate dev`: base de datos no encontrada**  
Asegúrate de haber creado la base de datos `lpc_db` en PostgreSQL antes de correr el comando (ver sección 3.2).

**Error: `@prisma/client` no inicializado**  
Ejecuta `npx prisma generate` para regenerar el cliente después de clonar el repositorio o de que alguien modifique el schema.

**Las rutas dan 404**  
Asegúrate de que la carpeta se llame `(auth)` con paréntesis, no `auth`. Renómbrala desde el Explorador de Windows si la terminal da error.

**Líneas rojas en los imports `@/...`**  
Abre VS Code, presiona `Ctrl + Shift + P` y ejecuta `TypeScript: Restart TS Server`.

**Error `Router action dispatched before initialization`**  
Detén el servidor, borra la caché y reinicia:
```bash
rm -rf .next
npm run dev
```

---

## Contacto del equipo

Cualquier duda coordinar por el canal del grupo antes de hacer cambios en `main`.
