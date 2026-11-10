# Portal del cliente

Aplicación independiente de React y Vite para el storefront. El servidor NestJS se ejecuta por separado.

## Requisitos

- Node.js 20.19+ (o 22.12+)
- npm
- API del servicio disponible en la URL configurada

## Instalar y ejecutar

```powershell
cd storefront
npm install
Copy-Item .env.example .env
npm run dev
```

Vite inicia el portal en `http://localhost:5173`. En `storefront/.env`, configura `VITE_API_BASE_URL` con la dirección base del backend. El backend debe permitir `http://localhost:5173` en su variable `ALLOWED_ORIGINS`.

Para generar el portal de producción: `npm run build`. Para validar sus tipos: `npm run typecheck`.

## Organización

- `src/features/`: páginas y comportamiento agrupados por área del negocio.
- `src/shared/api/`: cliente HTTP único, token, respuestas y errores del servicio.
- `src/app/`: navegación, sesión, rutas protegidas y layout común.
- `../src/shared/api-contracts.ts`: contratos HTTP compartidos con la API.

El portal solo contiene experiencias de cliente; no implementa una interfaz administrativa.
