# Casa Norte — Sistema de Reservas y Agenda

Plataforma web integral para consulta de espacios, disponibilidad en tiempo real, reservaciones, pagos y operación administrativa, estructurada como un **monorepo con tres aplicaciones independientes**:

- **`BACKEND/`** — API REST en **NestJS + Prisma 7 + MySQL** 

- **`FRONTEND/`** — Portal Público del Cliente  en **React 19 + Vite + TypeScript + Tailwind CSS** 

- **`FRONTEND-ADMIN/`** — Panel Administrativo  en **Angular 22** (puerto `4200`), exclusivo para operadores `ADMIN`



## Guía de Arranque Completo desde Cero (3 Aplicaciones)

### Paso 1. Instalar dependencias en los 3 proyectos

Desde la raiz:

- cd BACKEND
- npm install

- cd ../FRONTEND
- npm install

- cd ../FRONTEND-ADMIN
- npm install


### Paso 2. Configurar variables de entorno y URLs de servicio

1. **`BACKEND/.env`** — Crea `.env` a partir de `.env.example` asegurando ambos orígenes en `ALLOWED_ORIGINS`:

   - `DATABASE_URL="mysql://usuario:password@localhost:3306/sistema_reservas"`
   - `JWT_SECRET="super_secreto_jwt_para_sistema_reservas_2026"`
   - `PORT="3000"`
   - `ALLOWED_ORIGINS="http://localhost:5173,http://localhost:4200"`

2. **`FRONTEND/.env`** — Crea `.env` a partir de `.env.example` y verifica que apunte al backend:

   - `VITE_API_BASE_URL="http://localhost:3000"`

3. **`FRONTEND-ADMIN/`** — Ya viene preconfigurado apuntando a `http://localhost:3000` en:
   - `FRONTEND-ADMIN/src/environments/environment.development.ts`
   - `FRONTEND-ADMIN/src/environments/environment.ts`

### Paso 3. Ejecutar migraciones de Prisma y poblar el seeder

- `cd BACKEND`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npx prisma db seed`


### Paso 4. Levantar los 3 servidores simultáneamente (3 terminales)

- **Terminal 1 — API Backend (`http://localhost:3000`):**
  - cd BACKEND
  - npm run start:dev
  

- **Terminal 2 — Portal Público del Cliente (`http://localhost:5173`):**
  - cd FRONTEND
  - npm run dev


- **Terminal 3 — Panel Administrativo (`http://localhost:4200`):**
  - cd FRONTEND-ADMIN
  - npm start


### Paso 5. Verificar accesos

- **Portal Público del Cliente:** [http://localhost:5173](http://localhost:5173)
- **Panel Administrativo:** [http://localhost:4200](http://localhost:4200)
- **Documentación Swagger:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## Cuentas Precargadas (`BACKEND/prisma/seed.ts`)

- `ADMIN` — `admin@sistema.local` — `Admin123*`
- `ADMIN` — `admin@seeder.com` — `Admin123*`
- `CLIENTE` — `cliente@sistema.local` — `Cliente123*`
- `CLIENTE` — `cliente@seeder.com` — `Cliente123*`

## Comandos de Verificación y Pruebas

Desde **`BACKEND/`**:

- npm run typecheck
- npm run lint
- npm run build
- npm test
- npm run prueba:avance

Desde **`FRONTEND/`** :

- npm run typecheck
- npm run build


Desde **`FRONTEND-ADMIN/`**:

- npm run build
- npx ng test --watch=false

