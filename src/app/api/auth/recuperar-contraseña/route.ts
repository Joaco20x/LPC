// POST /api/auth/recuperar-contrasena — FR-01
// Genera token de recuperación y simula envío de correo
// TODO: integrar servicio de correo (Resend / Nodemailer)

import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/bd/prisma';
import { validarRecuperacion } from '@/lib/validaciones/autenticacion';
import {
  respuestaExito,
  respuestaError,
  respuestaErrorServidor,
} from '@/lib/api/respuestas';

const EXPIRACION_MINUTOS = 30;

export async function POST(req: NextRequest) {
  try {
    const cuerpo = await req.json();

    // Validar campo
    const errores = validarRecuperacion(cuerpo);
    if (errores.length > 0) {
      return respuestaError('Correo inválido');
    }

    const { correo } = cuerpo;

    // Buscar usuario — respuesta genérica para no revelar si existe
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
    });

    // Siempre responder con éxito aunque el correo no exista (seguridad)
    if (!usuario) {
      return respuestaExito({
        mensaje: 'Si el correo existe, recibirás las instrucciones en breve',
      });
    }

    // Invalidar tokens anteriores del usuario
    await prisma.tokenRecuperacion.updateMany({
      where: { idUsuario: usuario.id, usado: false },
      data: { usado: true },
    });

    // Generar nuevo token
    const token = randomBytes(32).toString('hex');
    const expiraEn = new Date();
    expiraEn.setMinutes(expiraEn.getMinutes() + EXPIRACION_MINUTOS);

    await prisma.tokenRecuperacion.create({
      data: {
        idUsuario: usuario.id,
        token,
        expiraEn,
      },
    });

    const urlRecuperacion = `${process.env.NEXT_PUBLIC_URL}/nueva-contrasena?token=${token}`;

    // TODO: Reemplazar con servicio de correo real
    // await servicioCorreo.enviar({
    //   para: correo,
    //   asunto: 'Recupera tu contraseña — LPC',
    //   cuerpo: `Haz click aquí: ${urlRecuperacion}`,
    // });

    // En desarrollo logueamos el link para pruebas
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Recuperación] Link para ${correo}: ${urlRecuperacion}`);
    }

    return respuestaExito({
      mensaje: 'Si el correo existe, recibirás las instrucciones en breve',
    });
  } catch (error) {
    console.error('[POST /api/auth/recuperar-contrasena]', error);
    return respuestaErrorServidor();
  }
}