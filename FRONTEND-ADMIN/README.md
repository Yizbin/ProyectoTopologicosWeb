# Casa Norte — Panel Administrativo (`FRONTEND-ADMIN`)

Aplicación web independiente para la operación interna del **Sistema de Reservas y Agenda "Casa Norte"**, construida con Angular 22

Este panel atiende únicamente al personal administrativo 


## Prerrequisitos

- **Node.js**
- **Angular CLI**
- Servicio BACKEND en ejecucion



## Configuración de la URL del Servicio y CORS

Si el backend corre en otro host o puerto (que no sea `http://localhost:3000`), edita únicamente `apiBaseUrl` en estos archivos:
- src/environments/environment.development.ts
- src/environments/environment.ts

Y asegurate de que `BACKEND/.env` incluya los origenes en `ALLOWED_ORIGINS`:
- ALLOWED_ORIGINS="http://localhost:5173,http://localhost:4200"




## Instalación, Ejecución, Compilación y Pruebas

Desde `FRONTEND-ADMIN/`:

1. **Instalar dependencias:**
- npm install

2. **Levantar servidor de desarrollo (`http://localhost:4200`):**
- npm start

3. **Compilar para producción (genera `dist/`):**
- npm run build

4. **Ejecutar pruebas unitarias en modo CI (Vitest):**
- npx ng test --watch=false



## Cuentas de Prueba (Seeder)
- ROL - CORREO - CONTRASEÑA - COMPORTAMIENTO LOGIN

- ADMIN - admin@sistema.local - Admin123* - Acceso completo al panel administrativo
- ADMIN - admin@seeder.com - Admin123* - Acceso completo al panel administrativo
- CLIENTE - cliente@sistema.local - Cliente123* - Rechazado en `/login` con aviso de rol `ADMIN` requerido


