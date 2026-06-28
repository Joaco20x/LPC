
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración necesaria para emular __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UMBRAL = 70; 
const COVERAGE_FILE = path.join(__dirname, 'coverage', 'coverage-summary.json');
const OUTPUT_FILE = path.join(__dirname, 'reporte_cobertura.txt');

try {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error("❌ No se encontró coverage-summary.json.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(COVERAGE_FILE, "utf-8");
  const coverageData = JSON.parse(rawData);

  let reporte = "--- REPORTE DE COBERTURA ---\n\n";
  let archivosFaltantes = [];

  for (const [filePath, metrics] of Object.entries(coverageData)) {
    if (filePath === "total") continue;

    const { lines, statements, functions, branches } = metrics;
    const promedioArchivo = (
      (lines.pct + statements.pct + functions.pct + branches.pct) /
      4
    ).toFixed(2);

    reporte += `${path.relative(__dirname, filePath)}: ${promedioArchivo}%\n`;

    if (
      lines.pct < UMBRAL ||
      statements.pct < UMBRAL ||
      functions.pct < UMBRAL ||
      branches.pct < UMBRAL
    ) {
      archivosFaltantes.push(path.relative(__dirname, filePath));
    }
  }

  // Agregar el resumen global que calcula Jest
  const total = coverageData.total;
  const promedioGlobal = (
    (total.lines.pct +
      total.statements.pct +
      total.functions.pct +
      total.branches.pct) /
    4
  ).toFixed(2);

  reporte += `\n--- RESUMEN GLOBAL ---\n`;
  reporte += `Porcentaje Global: ${promedioGlobal}%\n`;
  reporte += `Archivos bajo el umbral (${UMBRAL}%): ${archivosFaltantes.length}\n`;

  fs.writeFileSync(OUTPUT_FILE, reporte, "utf-8");
  console.log(`✅ Reporte generado en ${OUTPUT_FILE}`);
  console.log(`📊 Cobertura Global del Proyecto: ${promedioGlobal}%`);
} catch (error) {
  console.error("❌ Error:", error.message);
}

//GENERAR REPORTE GLOBAL npx jest --coverage --coverageReporters="json-summary" && node generar-reporte.js
