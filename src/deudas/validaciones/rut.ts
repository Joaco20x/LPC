const RUT_REGEX = /^(\d{1,8})-([\dkK])$/;

function digitoVerificador(rut: number): string {
  let suma = 0;
  let factor = 2;
  let temp = rut;
  while (temp > 0) {
    suma += (temp % 10) * factor;
    temp = Math.floor(temp / 10);
    factor = factor === 7 ? 2 : factor + 1;
  }
  const dv = 11 - (suma % 11);
  if (dv === 11) return "0";
  if (dv === 10) return "K";
  return dv.toString();
}

export function validarRut(rut: string): boolean {
  if (!RUT_REGEX.test(rut)) return false;
  const match = RUT_REGEX.exec(rut)!;
  const cuerpo = Number.parseInt(match[1], 10);
  const dvIngresado = match[2].toUpperCase();
  const dvCalculado = digitoVerificador(cuerpo);
  return dvIngresado === dvCalculado;
}
