.PHONY: install lint format format-check test-unit test-integration test-e2e test build dev

# ─────────────────────────────────────────────
# Instalación
# ─────────────────────────────────────────────
install:
	npm ci

# ─────────────────────────────────────────────
# Lint — ESLint con reglas TypeScript y Next.js
# ─────────────────────────────────────────────
lint:
	npx eslint . --ext .ts,.tsx --max-warnings=0

lint-fix:
	npx eslint . --ext .ts,.tsx --fix

# ─────────────────────────────────────────────
# Format — Prettier
# ─────────────────────────────────────────────
format:
	npx prettier --write .

format-check:
	npx prettier --check .

# ─────────────────────────────────────────────
# Testing
# ─────────────────────────────────────────────

# Pruebas unitarias con Jest (componentes, utilidades, hooks)
test-unit:
	npx jest --testPathPatterns="__test__/unit" --coverage --coverageDirectory=coverage

# Pruebas de integración (servicios, base de datos, API routes internas)
test-integration:
	npx jest --testPathPatterns="__test__/integration" --runInBand

# Pruebas E2E de API (endpoints REST con supertest)
test-e2e:
	npx jest --testPathPatterns="__test__/E2E" --runInBand --forceExit

# Correr todos los tests
test:
	make test-unit
	make test-integration
	make test-e2e

# ─────────────────────────────────────────────
# Build y desarrollo
# ─────────────────────────────────────────────
build:
	npx next build

dev:
	npx next dev

# Ejecutar todos los tests con cobertura combinada (para SonarQube)
test-coverage:
	npx jest --testPathPatterns="__test__" --runInBand --forceExit --coverage --coverageDirectory=coverage

# ─────────────────────────────────────────────
# CI completo local (mismo orden que el pipeline)
# ─────────────────────────────────────────────
ci:
	make lint
	make format-check
	make test