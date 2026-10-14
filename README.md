# Sistema de Reservas y Agenda - API Backend

Plataforma integral para la gestión de citas, espacios y reservaciones en tiempo real con control de disponibilidad, autenticación JWT, control de accesos basado en roles y persistencia relacional con Prisma ORM y MySQL.

---

## Requisitos Previos

- **Node.js**: v20 o superior 
- **MySQL**: Instancia local (puerto por defecto: `3306`)
- **Gestor de paquetes**: `npm`

---

## Guía de Instalación y Puesta en Marcha

### 1. Clonar el repositorio e instalar dependencias

npm install

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto basado en `.env.example`:

Configura en tu archivo `.env` la cadena de conexión a tu base de datos y la clave secreta para la firma de tokens JWT:

DATABASE_URL="mysql://usuario:password@localhost:3306/sistema_reservas"

JWT_SECRET="super_secreto_jwt_para_sistema_reservas_2026"

### 3. Ejecutar migraciones de la base de datos

Aplica el esquema y crea las tablas correspondientes en MySQL:

npx prisma migrate dev

### 4. Poblar la base de datos con datos iniciales (Seeder)

Inserta los datos de arranque necesarios para recorrer todos los casos de uso (usuarios de prueba con contraseñas encriptadas en bcrypt, sede, espacios y horarios de atención):

npx prisma db seed

También puedes ejecutar `npm run seed`.

### 5. Iniciar el servidor en modo desarrollo

npm run start:dev

## Documentación (Swagger)

Una vez iniciado el servidor, puedes explorar y probar todos los endpoints del servicio desde la interfaz interactiva de Swagger UI en:

- **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

Para probar endpoints protegidos desde Swagger:
1. Envía una petición `POST /auth/login` con las credenciales correspondientes.
2. Copia el valor de `access_token` retornado.
3. Haz clic en el botón **Authorize** (arriba a la derecha en Swagger) y pega el token.



## Cuentas de Prueba Precargadas (Seeder)


**ADMIN** 
- `admin@sistema.local`
- `Admin123*` 
- Gestión total de espacios
- Creación de bloqueos
- Confirmación de reservaciones y consulta de usuarios. 

**CLIENTE**
`cliente@sistema.local` 
`Cliente123*` 
- Creación y consulta de reservaciones propias
- Consulta pública del catálogo de espacios y horarios.



## Control de Accesos y Seguridad

- **Públicos:**
  - `GET /espacios` (Listado de espacios disponibles)
  - `GET /espacios/:id` (Detalle de un espacio)
  - `GET /espacios/:id/horarios` (Horarios de atención)
  - `GET /espacios/:id/bloqueos` (Fechas bloqueadas)
  - `POST /auth/login` (Inicio de sesión)
  - `POST /auth/registro` (Registro de cliente)

- **Usuarios Autenticados (Con el JwtAuthGuard):**
  - `POST /reservaciones` (Creación de reservas con validación de disponibilidad y no empalme)
  - `GET /reservaciones/:id` (Consulta de reservación)
  - `GET /reservaciones/cliente/:usuarioId` (Historial de reservas del cliente)
  - `PATCH /reservaciones/:id/cancelar` (Cancelación y liberación de horario)

- **Administradores (`@Roles(RolUsuario.ADMIN)`):**
  - `POST /espacios` (Registro de nuevos espacios)
  - `POST /espacios/:id/bloqueos` (Bloqueo administrativo de fechas y horas)
  - `PATCH /reservaciones/:id/confirmar` (Confirmar reservación)
  - `PATCH /reservaciones/:id/completar` (Completar reservación)
  - `GET /usuarios` (Listado general de usuarios)

> **Comprobaciones:**
> - Petición a endpoint administrativo sin token = **HTTP 401 Unauthorized**.
> - Petición a endpoint administrativo con token de rol `CLIENTE` = **HTTP 403 Forbidden**.
> - Petición con token de rol `ADMIN` = **HTTP 200 / 201 Success**.

---

## Ejecución de Pruebas

Para verificar la integridad del dominio, los filtros globales y las reglas de seguridad:


# Ejecutar todas las pruebas unitarias y de integración
npm test

# Ejecutar verificación de tipos TypeScript
npm run typecheck

# Validar reglas de negocio puras del dominio
npm run prueba:avance

