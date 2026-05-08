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

### 3.3 Crear las tablas

Desde la raíz del proyecto ejecuta:

```bash
psql -U postgres -d lpc_db -f lpc_tablas.sql
```

Al finalizar verás la lista de tablas creadas:

```
invitaciones
deudas
divisiones_gasto
gastos
grupos
miembros_grupo
notificaciones
sesiones
tokens_recuperacion
usuarios
```

---

## 4. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Base de datos
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/lpc_db

# JWT
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
JWT_EXPIRACION=1h
JWT_REFRESH_EXPIRACION=7d

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

> ⚠️ **Importante:** Reemplaza `TU_CONTRASEÑA` con la contraseña de tu usuario `postgres`.  
> ⚠️ **Nunca subas `.env.local` al repositorio.** Ya está incluido en `.gitignore`.

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
| `localhost:3000/iniciar-sesion` | Inicio de sesión |
| `localhost:3000/registro` | Crear cuenta |
| `localhost:3000/recuperar-contrasena` | Recuperar contraseña |

---

## 7. Estructura del proyecto

```
eatryp/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Layout raíz (html + body)
│   │   ├── page.tsx                      # Landing principal
│   │   ├── globals.css
│   │   ├── landing.css
│   │   └── (auth)/                       # Grupo de rutas de autenticación
│   │       ├── layout.tsx                # Layout del módulo auth
│   │       ├── auth.css
│   │       ├── iniciar-sesion/
│   │       │   └── page.tsx
│   │       ├── registro/
│   │       │   └── page.tsx
│   │       └── recuperar-contrasena/
│   │           └── page.tsx
│   ├── components/
│   │   └── autenticacion/
│   │       ├── CampoEntrada.tsx          # Input reutilizable
│   │       ├── BotonOAuth.tsx            # Botones Google / Apple
│   │       └── Separador.tsx             # Divisor visual
│   ├── lib/
│   │   └── validaciones/
│   │       ├── autenticacion.ts          # Funciones de validación
│   │       └── useFormulario.ts          # Hook genérico de formularios
│   └── types/
│       └── autenticacion.ts              # Interfaces TypeScript
├── lpc_tablas.sql                        # Script de creación de tablas
├── SETUP.md                              # Esta guía
└── .env.local                            # Variables de entorno (no subir al repo)
```

---

## 8. Tablas de la base de datos

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

## 9. Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| Next.js 16 + TypeScript | Framework principal (SSR + App Router) |
| React 19 | Interfaz de usuario |
| PostgreSQL | Base de datos relacional |
| bcrypt | Encriptación de contraseñas |
| JWT | Autenticación con tokens |
| Tailwind CSS v4 | Estilos utilitarios |

---

## 10. Problemas frecuentes

**Error: `psql` no se reconoce como comando**  
Agrega PostgreSQL al PATH de Windows. Busca la carpeta `bin` de tu instalación (ej: `C:\Program Files\PostgreSQL\16\bin`) y agrégala a las variables de entorno.

**Error al conectar a la base de datos**  
Verifica que el servicio de PostgreSQL esté corriendo. En Windows: `Servicios → postgresql-x64-XX → Iniciar`.

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
