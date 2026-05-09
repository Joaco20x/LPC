LPC — Plataforma de Gestión de Gastos de Viaje

Universidad Católica de Temuco · Diseño de Software · 2025
Equipo: Joaquín Valenzuela, Martin López, Vicente Santin, Deris Aránguiz, Bastián Liempi


Índice

Descripción
Requisitos previos
Instalación
Base de datos
Prisma ORM
Variables de entorno
Arquitectura del proyecto
Estructura de carpetas
Rutas disponibles
Problemas frecuentes


1. Descripción
LPC es una plataforma centralizada que integra el registro de gastos, la división automática de costos y el seguimiento de deudas para grupos de viaje.

2. Requisitos previos
HerramientaVersión mínimaNode.jsv18PostgreSQLv14GitcualquieraVS Codecualquiera

3. Instalación
bashgit clone <url-del-repositorio>
cd eatryp
npm install
npm run dev

4. Base de datos
Cada integrante crea su propia base de datos local.
Crear la base de datos
bashpsql -U postgres
Dentro de psql:
sqlCREATE DATABASE lpc_db;
\q
Crear las tablas
bashpsql -U postgres -d lpc_db -f lpc_tablas.sql
Tablas del sistema
TablaDescripciónusuariosDatos de usuarios registradostokens_recuperacionTokens para restablecer contraseñasesionesRefresh tokens JWT activosgruposGrupos de viajemiembros_grupoRelación usuario-grupo con rolgastosGastos dentro de un grupodivisiones_gastoDivisión de cada gastodeudasDeudas entre integrantesnotificacionesNotificaciones del sistemainvitacionesInvitaciones a grupos

5. Prisma ORM
Generar el cliente (obligatorio después de clonar):
bashnpx prisma generate
Verificar conexión:
bashnpx prisma db pull
Explorador visual:
bashnpx prisma studio

IMPORTANTE: Nunca ejecutes npx prisma migrate ni npx prisma db push sin coordinarlo con el equipo. Las tablas ya existen en la BD creadas con lpc_tablas.sql.


6. Variables de entorno
Crea un archivo .env en la raíz:
envDATABASE_URL="postgresql://postgres:TU_CONTRASENA@localhost:5432/lpc_db"
JWT_SECRET="clave_secreta_minimo_32_caracteres"
JWT_EXPIRACION="1h"
JWT_REFRESH_EXPIRACION="7d"
NEXT_PUBLIC_URL="http://localhost:3000"

Nunca subas .env al repositorio. Ya está en .gitignore.


7. Arquitectura del proyecto
El proyecto usa una Arquitectura en Capas separando responsabilidades en tres niveles:
Petición HTTP
      |
      v
 API Route              app/api_dor/[feature]/route.ts
      |                  Recibe la petición y delega al controlador.
      |                  Sin lógica de negocio.
      |
      v
 Controlador            src/backend/controllers/
      |                  Valida la petición HTTP.
      |                  Maneja cookies y sesiones.
      |                  Retorna respuesta al cliente.
      |                  NO accede directo a la base de datos.
      |
      v
 Servicio               src/backend/services/[feature]/
      |                  Contiene toda la lógica de negocio.
      |                  Realiza consultas a PostgreSQL via Prisma.
      |                  NO conoce HTTP ni cookies.
      |
      v
 PostgreSQL              src/backend/db/ (Prisma singleton)
Reglas por capa
CapaResponsabilidadProhibidoAPI RouteRecibir petición, llamar al controladorLógica de negocio, acceso a BDControladorValidar HTTP, manejar cookies, responderAcceso directo a PrismaServicioLógica de negocio, consultas PrismaManejar Request/Response, cookies
Ejemplo de flujo — Login
POST /api_dor/auth/login
        |
        v
LoginController (backend/controllers/)
  - valida los campos de la petición
  - llama a LoginService
  - guarda cookie con el accessToken
  - retorna respuesta HTTP
        |
        v
LoginService (backend/services/login/)
  - busca usuario en BD con Prisma
  - verifica contraseña (backend/auth/contraseña.ts)
  - genera JWT (backend/auth/jwt.ts)
  - guarda sesión en BD

8. Estructura de carpetas
eatryp/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── global.css
│   │   ├── landing.css
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── auth.css
│   │   │   ├── login/page.tsx
│   │   │   ├── registro/page.tsx
│   │   │   ├── recuperar-contrasena/page.tsx
│   │   │   └── nueva-contrasena/page.tsx
│   │   └── api_dor/
│   │       └── auth/
│   │           ├── login/route.ts
│   │           ├── logout/route.ts
│   │           ├── registro/route.ts
│   │           ├── recuperar-contrasena/route.ts
│   │           └── nueva-contrasena/route.ts
│   ├── backend/
│   │   ├── auth/
│   │   │   ├── contraseña.ts
│   │   │   └── jwt.ts
│   │   ├── controllers/
│   │   ├── db/
│   │   └── services/
│   │       ├── login/
│   │       ├── logout/
│   │       ├── nueva-contrasena/
│   │       ├── recuperar-contrasena/
│   │       └── registro/
│   ├── frontend/
│   │   └── components/
│   │       └── autenticacion/
│   └── shared/
│       ├── types/
│       └── validaciones/
├── lpc_tablas.sql
├── README.md
└── .env

9. Rutas disponibles
RutaDescripciónlocalhost:3000/Landing principallocalhost:3000/loginInicio de sesiónlocalhost:3000/registroCrear cuentalocalhost:3000/recuperar-contrasenaRecuperar contraseña (paso 1)localhost:3000/nueva-contrasena?token=...Nueva contraseña (paso 2)

10. Problemas frecuentes
psql no se reconoce
Agrega C:\Program Files\PostgreSQL\16\bin al PATH de Windows.
Error de conexión a la BD
Windows → Servicios → postgresql-x64-XX → Iniciar.
Rutas dan 404
La carpeta debe llamarse (auth) con paréntesis. Renómbrala desde el Explorador de Windows.
Líneas rojas en @/...
Ctrl + Shift + P → TypeScript: Restart TS Server
Error Router action dispatched before initialization
bashrm -rf .next && npm run dev
Prisma no encuentra los modelos
bashnpx prisma generate
