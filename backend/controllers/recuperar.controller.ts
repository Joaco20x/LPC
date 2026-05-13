import { NextRequest, NextResponse } from 'next/server';
import { iniciarRecuperacion } from '@/backend/services/recuperar-contrasena/recuperar.service';
import { validarRecuperacion } from '@/shared/validaciones/autenticacion';

export async function controladorRecuperarContrasena(req: NextRequest) {
  try {
    const { correo } = await req.json();
    const errores = validarRecuperacion({ correo });

    if (errores.length > 0) return NextResponse.json({ mensaje: 'Correo inválido' }, { status: 400 });

    await iniciarRecuperacion(correo);

    return NextResponse.json({
      exito: true,
      mensaje: 'Si el correo existe, recibirás instrucciones en breve'
    });
  } catch (error) {
    return NextResponse.json({ mensaje: 'Error interno' }, { status: 500 });
  }
}