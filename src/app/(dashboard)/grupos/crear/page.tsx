'use client';

import React from 'react';
import './crear-grupo.css';
import CampoEntrada from '@/frontend/components/autenticacion/CampoEntrada';
import { useCrearGrupo } from '@/frontend/components/esquemas/useCrearGrupo';


export default function PaginaCrearGrupo() {
  const {
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
  } = useCrearGrupo();

  return (
    <main className="crear-grupo-raiz">
      <div className="crear-grupo-card">

        <div className="pasos-indicador">
          <div className={`paso-punto ${paso >= 1 ? 'paso-punto--activo' : ''}`} />
          <div className={`paso-punto ${paso >= 2 ? 'paso-punto--activo' : ''}`} />
        </div>

        {errorGlobal && <div className="auth-mensaje auth-mensaje--error">{errorGlobal}</div>}

        {paso === 1 ? (
          <section className="seccion-wizard">
            <h1 className="titulo-paso">Detalles del Viaje</h1>
            <p className="descripcion-paso">Comencemos por lo básico: ¿A dónde van y cuándo?</p>

            <CampoEntrada
              id="nombre" etiqueta="Nombre del Grupo" valor={datosGrupo.nombre}
              onChange={(v) => actualizarDatosGrupo('nombre', v)}
            />
            <CampoEntrada
              id="pais" etiqueta="País de destino" valor={datosGrupo.pais}
              onChange={(v) => actualizarDatosGrupo('pais', v)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <CampoEntrada
                id="inicio" etiqueta="Inicio" tipo="date" valor={datosGrupo.fechaInicio}
                onChange={(v) => actualizarDatosGrupo('fechaInicio', v)}
              />
              <CampoEntrada
                id="fin" etiqueta="Fin" tipo="date" valor={datosGrupo.fechaFin}
                onChange={(v) => actualizarDatosGrupo('fechaFin', v)}
              />
            </div>

            <div className="acciones-wizard">
              <span />
              <button
                className="boton-primario"
                onClick={() => setPaso(2)}
                disabled={!datosGrupo.nombre || !datosGrupo.pais}
              >
                Siguiente: Integrantes
              </button>
            </div>
          </section>
        ) : (
          <section className="seccion-wizard">
            <h1 className="titulo-paso">Añadir Integrantes</h1>
            <p className="descripcion-paso">Busca a tus amigos por su correo institucional.</p>

            <div className="buscador-integrantes">
              <div style={{ flex: 1 }}>
                <CampoEntrada
                  id="search" etiqueta="Correo electrónico" valor={correoBusqueda}
                  placeholder="ejemplo@ufrontera.cl"
                  onChange={setCorreoBusqueda}
                />
              </div>
              <button
                className="boton-secundario"
                onClick={buscarYAñadir}
                disabled={buscandoUsuario || !correoBusqueda}
                style={{ height: '3.5rem', marginBottom: '0.5rem' }}
              >
                {buscandoUsuario ? '...' : 'Añadir'}
              </button>
            </div>

            <ul className="lista-integrantes">
              {listaIntegrantes.map(integrante => (
                <li key={integrante.id} className="integrante-item">
                  <div className="integrante-info">
                    <span className="integrante-nombre">{integrante.nombre}</span>
                    <span className="integrante-correo">{integrante.correo}</span>
                  </div>
                  <button
                    className="boton-eliminar"
                    onClick={() => eliminarIntegrante(integrante.id)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>

            <div className="acciones-wizard">
              <button className="boton-secundario" onClick={() => setPaso(1)}>Atrás</button>
              <button
                className={`boton-primario ${cargando ? 'boton-primario--cargando' : ''}`}
                onClick={finalizarCreacion}
                disabled={cargando || listaIntegrantes.length === 0}
              >
                Crear Grupo ({listaIntegrantes.length + 1}/6)
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}