-- AlterTable
ALTER TABLE "divisiones_gasto" ADD COLUMN     "moneda" VARCHAR(10) NOT NULL DEFAULT 'CLP';

-- AlterTable
ALTER TABLE "gastos" ADD COLUMN     "moneda" VARCHAR(10) NOT NULL DEFAULT 'CLP';
