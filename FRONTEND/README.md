# Portal del Cliente

Aplicación independiente de React, Vite, TypeScript y Tailwind CSS para el portal público del cliente. El servidor NestJS (`BACKEND/`) se ejecuta por separado; este portal no incluye vistas ni acciones administrativas.

## Requisitos

- Node.js 20.19+ (o 22.12+)
- npm
- API del servicio (`BACKEND/`) ejecutándose y accesible desde la URL configurada

## Instalar y ejecutar


cd FRONTEND
npm install
Configurar .env
npm run dev


Vite inicia el portal en `http://localhost:5173`. En `FRONTEND/.env`, configura `VITE_API_BASE_URL` apuntando al servicio del backend (por defecto `http://localhost:3000`). En `BACKEND/.env`, asegúrate de incluir `http://localhost:5173` en la variable `ALLOWED_ORIGINS`.

### Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo en `http://localhost:5173`
- `npm run typecheck`: valida todos los tipos con TypeScript (`tsc -p tsconfig.json --noEmit`)
- `npm run build`: verifica tipos y genera el bundle de producción en `dist/`

