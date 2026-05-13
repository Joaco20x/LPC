import { NextRequest, NextResponse } from 'next/server';
import { cambiarContrasenaConToken } from '@/backend/services/nueva-contrasena/nueva-contrasena.service';
import { validarContrasena } from '@/shared/validaciones/autenticacion';

export async function controladorNuevaContrasena(req: NextRequest) {
  try {
    const { token, contrasena } = await req.json();
    
    if (!token) return NextResponse.json({ mensaje: 'Token requerido' }, { status: 400 });
    
    const errorContrasena = validarContrasena(contrasena);
    if (errorContrasena) return NextResponse.json({ mensaje: errorContrasena }, { status: 422 });

    await cambiarContrasenaConToken(token, contrasena);

    return NextResponse.json({ exito: true, mensaje: 'Contraseña actualizada' });
  } catch (error: any) {
    return NextResponse.json({ mensaje: error.message }, { status: 400 });
  }
}