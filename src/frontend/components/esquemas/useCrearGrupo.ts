'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { peticionAutenticada } from '@/shared/servicios/peticionAutenticada';
import { obtenerDatosUsuario } from '@/shared/servicios/almacenamientoTokens';
interface Integrante {
  id: string;
  nombre: string;
  correo: string;
}

interface DatosGrupo {
  nombre: string;
  pais: string;
  fechaInicio: string;
  fechaFin: string;
}

const datosGrupoInicial: DatosGrupo = {
  nombre: '',
  pais: '',
  fechaInicio: '',
  fechaFin: '',
};

export function useCrearGrupo() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [datosGrupo, setDatosGrupo] = useState<DatosGrupo>(datosGrupoInicial);
  const [correoBusqueda, setCorreoBusqueda] = useState('');
  const [listaIntegrantes, setListaIntegrantes] = useState<Integrante[]>([]);

  const actualizarDatosGrupo = (campo: keyof DatosGrupo, valor: string) => {
    setDatosGrupo(prev => ({ ...prev, [campo]: valor }));
  };

  const eliminarIntegrante = (id: string) => {
    setListaIntegrantes(prev => prev.filter(i => i.id !== id));
  };

  const buscarYAñadir = async () => {
    if (!correoBusqueda.includes('@')) return;
    if (listaIntegrantes.length >= 5) {
      setErrorGlobal('Límite alcanzado: máximo 6 personas (tú + 5 invitados)');
      return;
    }

    setBuscandoUsuario(true);
    setErrorGlobal(null);

    try {
      const res = await peticionAutenticada(`/api_dor/usuarios/buscar?correo=${correoBusqueda}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.mensaje || 'Usuario no encontrado');

      const usuario = data.datos.usuario;
      
      // Verificar si el usuario encontrado es el mismo que está logueado
      const datosPropios = obtenerDatosUsuario() ?? {};
      if (usuario.id === datosPropios.id) {
        throw new Error('No puedes añadirte a ti mismo, ya eres parte del grupo como administrador');
      }

      if (listaIntegrantes.some(i => i.id === usuario.id)) {
        throw new Error('Este usuario ya está en la lista');
      }

      setListaIntegrantes(prev => [...prev, usuario]);
      setCorreoBusqueda('');
    } catch (err: any) {
      setErrorGlobal(err.message);
    } finally {
      setBuscandoUsuario(false);
    }
  };

  const finalizarCreacion = async () => {
    if (listaIntegrantes.length < 1) {
      setErrorGlobal('Debes añadir al menos 1 integrante para crear el grupo');
      return;
    }

    setCargando(true);
    setErrorGlobal(null);

    try {
      const respuesta = await peticionAutenticada('/api_dor/grupos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: datosGrupo.nombre,
          pais: datosGrupo.pais,
          fechaInicio: datosGrupo.fechaInicio,
          fechaFin: datosGrupo.fechaFin,
          monedaBase: 'CLP',
          correosIntegrantes: listaIntegrantes.map(i => i.correo),
        }),
      });

      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        // Si hay errores de validación individuales, mostrarlos todos
        if (resultado.errores && Array.isArray(resultado.errores)) {
          const detalle = resultado.errores
            .map((e: { campo: string; mensaje: string }) => e.mensaje)
            .join(' • ');
          throw new Error(detalle || resultado.mensaje || 'Error al crear el grupo');
        }
        throw new Error(resultado.mensaje || 'Error al crear el grupo');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setErrorGlobal(err.message);
    } finally {
      setCargando(false);
    }
  };

  return {
    paso,
    cargando,
    buscandoUsuario,
    errorGlobal,
    datosGrupo,
    correoBusqueda,
    listaIntegrantes,
    setPaso,
    setCorreoBusqueda,
    actualizarDatosGrupo,
    eliminarIntegrante,
    buscarYAñadir,
    finalizarCreacion,
  };
}