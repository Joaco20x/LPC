import { NextRequest, NextResponse } from 'next/server';
import { iniciarRecuperacion } from '@/backend/services/recuperar-contrasena/recuperar.service';
import { validarRecuperacion } from '@/shared/validaciones/autenticacion';
import { crearDependencias } from '@/backend/di/crearDependencias';

export async function controladorRecuperarContrasena(req: NextRequest) {
  try {
    const cuerpo = await req.json();
    const errores = validarRecuperacion(cuerpo);

    if (errores.length > 0) {
      return NextResponse.json({ exito: false, mensaje: 'Datos inválidos' }, { status: 400 });
    }

    const { usuarioRepo, tokenRecuperacionRepo } = crearDependencias();
    await iniciarRecuperacion(cuerpo.correo, usuarioRepo, tokenRecuperacionRepo);

    return NextResponse.json({
      exito: true,
      mensaje: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña',
    }, { status: 200 });
  } catch {
    return NextResponse.json({ exito: false, mensaje: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
