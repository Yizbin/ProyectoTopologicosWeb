# Sistema de Reservas y Agenda — Frontend / Backend

Sistema web para consulta de espacios, verificación de disponibilidad en tiempo real y gestión de reservaciones, dividido en dos aplicaciones independientes dentro del mismo repositorio:

- **`BACKEND/`**: API REST en **NestJS** con arquitectura limpia (Clean Architecture), reglas de dominio encapsuladas, autenticación JWT con control de acceso por roles (`CLIENTE` / `ADMIN`), documentación Swagger y persistencia en **MySQL** vía **Prisma ORM**.

- **`FRONTEND/`**: Portal público del cliente (**Storefront**) en **React 19 + Vite + TypeScript + Tailwind CSS**, organizado por características (`auth`, `catalog`, `booking`) y conectado a la API mediante Axios e interceptores centralizados. *Este portal es exclusivamente para clientes finales y no contiene panel ni acciones de administración.*

---

## Guía de Arranque Rápido (5 Pasos)

### Paso 1. Instalar dependencias en ambas aplicaciones

Desde la raíz del monorepo, instala los paquetes de `BACKEND/` y `FRONTEND/`:


cd BACKEND
npm install


cd ..\FRONTEND
npm install



### Paso 2. Configurar variables de entorno

1. En `BACKEND/`, crea el archivo `BACKEND/.env` tomando como base `BACKEND/.env.example`:

   DATABASE_URL="mysql://usuario:password@localhost:3306/sistema_reservas"
   JWT_SECRET="super_secreto_jwt_para_sistema_reservas_2026"
   ALLOWED_ORIGINS="http://localhost:5173"


2. En `FRONTEND/`, copia `FRONTEND/.env.example` hacia `FRONTEND/.env`:

   Verifica que `FRONTEND/.env` contenga `VITE_API_BASE_URL="http://localhost:3000"`.

### Paso 3. Ejecutar migraciones y poblar datos de semilla (Seeder)

Con MySQL encendido y la base de datos creada, ejecuta las migraciones y la semilla desde `BACKEND/`:


cd BACKEND
npx prisma migrate dev
npx prisma db seed (O tambien: npm run seed)


### Paso 4. Levantar los servidores

- **Terminal 1 — API Backend (`http://localhost:3000`)**:

  cd BACKEND
  npm run start:dev
  

- **Terminal 2 — Portal del Cliente (`http://localhost:5173`)**:

  cd FRONTEND
  npm run dev


### Paso 5. Verificar el funcionamiento

- **Portal del Cliente (Storefront)**: [http://localhost:5173](http://localhost:5173)
- **Documentación interactiva Swagger (API)**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## Cuentas Precargadas 

| Rol | Correo | Contraseña | Uso principal |

| `CLIENTE` | `cliente@sistema.local` | `Cliente123*` | Cuenta para probar reservas |
| `CLIENTE` | `cliente@seeder.com` | `Cliente123*` | Cuenta cliente secundaria |
| `ADMIN` | `admin@seeder.com` | `Admin123*` | Exclusiva para pruebas de endpoints administrativos  |

---

## Ejecución de pruebas y validaciones

Desde `BACKEND/`:

npm test              
npm run typecheck     
npm run lint          
npm run prueba:avance

Desde `FRONTEND/`:

npm run typecheck    
npm run build        

