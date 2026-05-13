// Página de registro de gasto — protegida por (auth)
// Pasa los datos reales del grupo al componente DivisionGasto

import DivisionGasto from '@/frontend/components/gastos/DivisionGasto';

// TODO: reemplazar con datos reales del grupo desde la sesión/DB
const INTEGRANTES_EJEMPLO = [
  { id: 'u1', nombre: 'Valentina Rojas', iniciales: 'VR', color: '#5DCAA5' },
  { id: 'u2', nombre: 'Matías Herrera',  iniciales: 'MH', color: '#7F77DD' },
  { id: 'u3', nombre: 'Sofía Méndez',    iniciales: 'SM', color: '#D85A30' },
  { id: 'u4', nombre: 'Tomás Fuentes',   iniciales: 'TF', color: '#378ADD' },
  { id: 'u5', nombre: 'Camila Torres',   iniciales: 'CT', color: '#D4537E' },
];

export default function PaginaGasto() {
  return (
    <main style={{ padding: '2rem' }}>
      <DivisionGasto
        idGrupo="grupo-placeholder"
        integrantes={INTEGRANTES_EJEMPLO}
      />
    </main>
  );
}
