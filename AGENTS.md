# AGENTS — Comandos y notas del proyecto

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build producción
npm test             # Tests
npx prisma generate  # Regenerar cliente Prisma
npx prisma migrate deploy  # Aplicar migraciones pendientes
```

## Notas

- 6 migraciones Prisma aplicadas correctamente.
- El error `The column 'deudas.estado' does not exist` se resolvió marcando la migración `20260702200829_pull_actualizacion` como aplicada (falló parcialmente pero creó la tabla) y luego ejecutando `prisma migrate deploy` para `20260703012110_add_comprobante_pago`.
- El formulario de votación usa un `<select>` en lugar de input manual de UUID. Las deudas se cargan desde `/api/deudas?grupo=ID`.
- Los tests pasan (57 suites, 497 tests), build y eslint OK.
