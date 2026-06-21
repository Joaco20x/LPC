import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eatryp API',
      version: '1.0.0',
      description: 'API de gestión de gastos compartidos',
    },
    servers: [{ url: '/api', description: 'API local' }],
    tags: [
      { name: 'Autenticación', description: 'Login, registro, logout, refresh, recuperación de contraseña' },
      { name: 'Gastos', description: 'Registro y consulta de gastos' },
      { name: 'Grupos', description: 'Creación y detalle de grupos' },
      { name: 'Deudas', description: 'Deudas pendientes' },
      { name: 'Usuarios', description: 'Búsqueda de usuarios' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        RespuestaAPI: {
          type: 'object',
          properties: {
            exito: { type: 'boolean' },
            mensaje: { type: 'string' },
            datos: { type: 'object', nullable: true },
          },
        },
        ErrorCampo: {
          type: 'object',
          properties: {
            campo: { type: 'string' },
            mensaje: { type: 'string' },
          },
        },
        DatosInicioSesion: {
          type: 'object',
          required: ['correo', 'contrasena'],
          properties: {
            correo: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
            contrasena: { type: 'string', format: 'password', example: 'MiPass123' },
          },
        },
        DatosRegistro: {
          type: 'object',
          required: ['nombre', 'correo', 'contrasena', 'confirmarContrasena'],
          properties: {
            nombre: { type: 'string', example: 'Juan Pérez' },
            correo: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            contrasena: { type: 'string', format: 'password', example: 'MiPass123' },
            confirmarContrasena: { type: 'string', format: 'password', example: 'MiPass123' },
          },
        },
        DatosRecuperacion: {
          type: 'object',
          required: ['correo'],
          properties: {
            correo: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
          },
        },
        DatosNuevaContrasena: {
          type: 'object',
          required: ['token', 'nuevaContrasena'],
          properties: {
            token: { type: 'string', example: 'abc123token' },
            nuevaContrasena: { type: 'string', format: 'password', example: 'NuevaPass456' },
          },
        },
        DatosRefreshToken: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        DivisionGastoInput: {
          type: 'object',
          required: ['idUsuario', 'montoAsignado', 'tipoDivision'],
          properties: {
            idUsuario: { type: 'string', format: 'uuid' },
            montoAsignado: { type: 'number', example: 2500 },
            tipoDivision: { type: 'string', enum: ['igual', 'exacto', 'porcentaje'], example: 'igual' },
          },
        },
        DatosGasto: {
          type: 'object',
          properties: {
            idGrupo: { type: 'string', format: 'uuid', nullable: true },
            idPagador: { type: 'string', format: 'uuid', nullable: true },
            monto: { type: 'number', nullable: true, example: 10000 },
            descripcion: { type: 'string', nullable: true, example: 'Cena en restaurante' },
            categoria: { type: 'string', nullable: true, example: 'comida' },
            urlBoleta: { type: 'string', nullable: true, example: 'https://ejemplo.com/boleta.jpg' },
            divisiones: {
              type: 'array',
              items: { $ref: '#/components/schemas/DivisionGastoInput' },
            },
          },
        },
        DatosCreacionGrupo: {
          type: 'object',
          required: ['nombre', 'pais', 'fechaInicio', 'fechaFin', 'correosIntegrantes'],
          properties: {
            nombre: { type: 'string', example: 'Viaje a la playa' },
            pais: { type: 'string', example: 'Chile' },
            fechaInicio: { type: 'string', format: 'date', example: '2026-06-01' },
            fechaFin: { type: 'string', format: 'date', example: '2026-06-10' },
            monedaBase: { type: 'string', example: 'CLP' },
            correosIntegrantes: {
              type: 'array',
              items: { type: 'string', format: 'email' },
              example: ['ana@ejemplo.com', 'luis@ejemplo.com'],
            },
          },
        },
        DeudaItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            monto: { type: 'number' },
            grupo: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                nombre: { type: 'string' },
              },
            },
            contraparte: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                nombre: { type: 'string' },
                correo: { type: 'string', format: 'email' },
              },
            },
            actualizadoEn: { type: 'string', format: 'date-time' },
          },
        },
        DeudasPendientes: {
          type: 'object',
          properties: {
            debo_a: {
              type: 'array',
              items: { $ref: '#/components/schemas/DeudaItem' },
            },
            me_deben: {
              type: 'array',
              items: { $ref: '#/components/schemas/DeudaItem' },
            },
          },
        },
        OpcionesFormulario: {
          type: 'object',
          properties: {
            grupos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  nombre: { type: 'string' },
                },
              },
            },
            miembros: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  nombre: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/route.ts'],
};

export function getSwaggerSpec() {
  return swaggerJsdoc(options);
}
