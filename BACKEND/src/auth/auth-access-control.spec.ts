import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EspaciosController } from '../espacios/espacios.controller.js';
import { SedesController } from '../espacios/sedes.controller.js';
import { EspaciosService } from '../espacios/espacios.service.js';
import { ReservacionesController } from '../reservaciones/reservaciones.controller.js';
import { ReservacionesService } from '../reservaciones/reservaciones.service.js';
import { PagosController } from '../pagos/pagos.controller.js';
import { PagosService } from '../pagos/pagos.service.js';
import { UsuariosController } from '../usuarios/usuarios.controller.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { DashboardController } from '../dashboard/dashboard.controller.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { RolesGuard } from './guards/roles.guard.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { DominioExceptionFilter } from '../common/filters/dominio-exception.filter.js';

describe('Control de Accesos (Roles, Guards y HTTP Status)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockEspaciosService = {
    crearEspacio: () => Promise.resolve({ id: 'espacio-1', nombre: 'Sala VIP' }),
    crearBloqueo: () => Promise.resolve({ id: 'bloqueo-1', motivo: 'Mantenimiento' }),
    desactivarBloqueo: () => Promise.resolve({ id: 'bloqueo-1', activo: false }),
    listarSedes: () => Promise.resolve([{ id: 'sede-1', nombre: 'Sede Principal' }]),
    listarEspacios: () => Promise.resolve([{ id: 'espacio-1', nombre: 'Sala VIP' }]),
    obtenerEspacioPorId: () => Promise.resolve({ id: 'espacio-1', nombre: 'Sala VIP' }),
    obtenerHorarios: () => Promise.resolve([]),
    obtenerBloqueos: () => Promise.resolve([]),
    buscarEspacios: () => Promise.resolve([{ id: 'espacio-1', nombre: 'Sala VIP' }]),
    actualizarEspacio: () => Promise.resolve({ id: 'espacio-1', nombre: 'Sala VIP editada' }),
    reemplazarHorarios: () => Promise.resolve([]),
    obtenerDisponibilidad: () => Promise.resolve({ espacioId: 'espacio-1', libres: [], ocupados: [] }),
  };

  const mockReservacionesService = {
    crearReservacion: () => Promise.resolve({ id: 'res-1' }),
    obtenerPorId: () => Promise.resolve({ id: 'res-1' }),
    obtenerHistorialCliente: () => Promise.resolve([]),
    confirmarReservacion: () => Promise.resolve(),
    completarReservacion: () => Promise.resolve(),
    cancelarReservacion: () => Promise.resolve(),
    crearReservacionesMultiples: () => Promise.resolve([{ id: 'res-1', subtotal: 200 }, { id: 'res-2', subtotal: 200 }]),
    listarReservaciones: () => Promise.resolve([]),
    listarReservacionesAdmin: () => Promise.resolve([{ id: 'res-1' }]),
  };

  const mockPagosService = {
    registrarPago: () => Promise.resolve([{ id: 'pago-1', montoTotal: 200 }]),
    listarPagos: () => Promise.resolve([{ id: 'pago-1', montoTotal: 200 }]),
    obtenerPorId: () => Promise.resolve({ id: 'pago-1' }),
    completarPago: () => Promise.resolve({ id: 'pago-1' }),
  };

  // La estrategia JWT revalida cada sesión contra la BD; aquí cada token de prueba
  // declara en su `sub` el rol que la "BD" debe confirmar.
  const rolesSesion = new Map<string, RolUsuario>();

  const mockUsuariosService = {
    obtenerEstadoSesion: (id: string) =>
      Promise.resolve({ activo: true, rol: rolesSesion.get(id) ?? RolUsuario.CLIENTE }),
    crearUsuario: () => Promise.resolve({ id: 'u1', nombre: 'Nuevo', correo: 'n@t.com', telefono: '555', contrasena: 'hash', rol: RolUsuario.CLIENTE }),
    listarUsuarios: () => Promise.resolve([{ id: 'u1', nombre: 'Ana', correo: 'ana@test.com', telefono: '555', rol: RolUsuario.CLIENTE }]),
    actualizarUsuario: (id: string) => Promise.resolve({ id, nombre: 'Editado', correo: 'ana@test.com', telefono: '555', contrasena: 'hash', rol: RolUsuario.CLIENTE, activo: true }),
    cambiarEstado: (id: string, activo: boolean) => Promise.resolve({ id, nombre: 'Ana', correo: 'ana@test.com', telefono: '555', contrasena: 'hash', rol: RolUsuario.CLIENTE, activo }),
    buscarPorId: (id: string) => Promise.resolve({ id, nombre: 'Ana', correo: 'ana@test.com', telefono: '555', contrasena: 'hash', rol: RolUsuario.CLIENTE }),
  };

  const mockDashboardService = {
    obtenerResumen: () => Promise.resolve({
      espacios: { total: 1, activos: 1, inactivos: 0 },
      reservaciones: { total: 0, pendientes: 0, confirmadas: 0, completadas: 0, canceladas: 0, hoy: 0, proximos7Dias: 0 },
      ingresos: { acumulados: 0, pendientesPorCobrar: 0, pagosCompletados: 0, pagosPendientes: 0 },
      usuarios: { total: 1, clientes: 1, admins: 0 },
      topEspacios: [],
      ultimasReservaciones: [],
    }),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'secreto_para_pruebas_de_seguridad_2026';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [
        EspaciosController,
        SedesController,
        ReservacionesController,
        PagosController,
        UsuariosController,
        DashboardController,
      ],
      providers: [
        JwtStrategy,
        RolesGuard,
        { provide: EspaciosService, useValue: mockEspaciosService },
        { provide: ReservacionesService, useValue: mockReservacionesService },
        { provide: PagosService, useValue: mockPagosService },
        { provide: UsuariosService, useValue: mockUsuariosService },
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DominioExceptionFilter());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  const generarToken = (rol: RolUsuario) => {
    const sub = rol === RolUsuario.ADMIN ? 'admin-test-id' : 'usuario-test-id';
    rolesSesion.set(sub, rol);
    return jwtService.sign({
      sub,
      correo: 'test@example.com',
      rol,
      nombre: 'Usuario Test',
    });
  };

  afterEach(async () => {
    await app.close();
  });

  it.each(['expired', 'tampered'])('rechaza un JWT %s en una ruta protegida con HTTP 401 uniforme', async (kind) => {
    const claims = {
      sub: 'usuario-test-id',
      correo: 'test@example.com',
      rol: RolUsuario.CLIENTE,
    };
    const validToken = kind === 'expired'
      ? jwtService.sign(claims, { expiresIn: '-1s' })
      : jwtService.sign(claims);
    const token = kind === 'expired'
      ? validToken
      : (() => {
          const [header, payload, signature] = validToken.split('.');
          const changedSignature = `${signature[0] === 'a' ? 'b' : 'a'}${signature.slice(1)}`;
          return `${header}.${payload}.${changedSignature}`;
        })();

    const res = await request(app.getHttpServer())
      .get('/reservaciones/res-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(expect.objectContaining({
      success: false,
      statusCode: 401,
      message: expect.any(String),
      timestamp: expect.any(String),
      path: '/reservaciones/res-1',
    }));
  });

  describe('Endpoints Administrativos (ej. POST /espacios)', () => {
    it('1. Debe devolver HTTP 401 si NO se envía token', async () => {
      const res = await request(app.getHttpServer())
        .post('/espacios')
        .send({
          nombre: 'Sala Nueva',
          descripcion: 'Descripción',
          tipo: TipoEspacio.SALA,
          costoPorHora: 150,
          duracionMinutos: 60,
          sedeId: 'sede-1',
          capacidadMaxima: 10,
          amenidades: ['WiFi'],
          minimoHorasReserva: 1,
          maximoHorasReserva: 4,
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('No autorizado');
    });

    it('2. Debe devolver HTTP 403 si un usuario con rol CLIENTE intenta acceder', async () => {
      const tokenCliente = generarToken(RolUsuario.CLIENTE);

      const res = await request(app.getHttpServer())
        .post('/espacios')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          nombre: 'Sala Nueva',
          descripcion: 'Descripción',
          tipo: TipoEspacio.SALA,
          costoPorHora: 150,
          duracionMinutos: 60,
          sedeId: 'sede-1',
          capacidadMaxima: 10,
          amenidades: ['WiFi'],
          minimoHorasReserva: 1,
          maximoHorasReserva: 4,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Acceso denegado: se requiere el rol ADMIN');
    });

    it('3. Debe permitir el acceso (HTTP 201) si un usuario con rol ADMIN envía su token', async () => {
      const tokenAdmin = generarToken(RolUsuario.ADMIN);

      const res = await request(app.getHttpServer())
        .post('/espacios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Sala Nueva',
          descripcion: 'Descripción',
          tipo: TipoEspacio.SALA,
          costoPorHora: 150,
          duracionMinutos: 60,
          sedeId: 'sede-1',
          capacidadMaxima: 10,
          amenidades: ['WiFi'],
          minimoHorasReserva: 1,
          maximoHorasReserva: 4,
        });

      expect(res.status).toBe(201);
    });

    it('4. Debe devolver HTTP 401 en POST /espacios/:id/bloqueos sin token y 403 con rol CLIENTE', async () => {
      const resSinToken = await request(app.getHttpServer())
        .post('/espacios/espacio-1/bloqueos')
        .send({
          fechaInicio: '2026-11-01',
          fechaFin: '2026-11-01',
          horaInicio: '08:00',
          horaFin: '12:00',
          motivo: 'Pintura',
        });
      expect(resSinToken.status).toBe(401);

      const tokenCliente = generarToken(RolUsuario.CLIENTE);
      const resCliente = await request(app.getHttpServer())
        .post('/espacios/espacio-1/bloqueos')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          fechaInicio: '2026-11-01',
          fechaFin: '2026-11-01',
          horaInicio: '08:00',
          horaFin: '12:00',
          motivo: 'Pintura',
        });
      expect(resCliente.status).toBe(403);

      const tokenAdmin = generarToken(RolUsuario.ADMIN);
      const resAdmin = await request(app.getHttpServer())
        .post('/espacios/espacio-1/bloqueos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          fechaInicio: '2026-11-01',
          fechaFin: '2026-11-01',
          horaInicio: '08:00',
          horaFin: '12:00',
          motivo: 'Pintura',
        });
      expect(resAdmin.status).toBe(201);
    });
  });

  describe('Endpoints Públicos (GET /espacios)', () => {
    it('Debe permitir la consulta pública de espacios sin enviar ningún token (HTTP 200)', async () => {
      const res = await request(app.getHttpServer()).get('/espacios');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Endpoints de Creación de Reservas', () => {
    it('Debe rechazar la creación de reservación sin autenticación con HTTP 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservaciones')
        .send({
          fecha: '2026-11-01',
          horaInicio: '10:00',
          horaFin: '11:00',
          espacioId: 'espacio-1',
          usuarioId: 'usuario-1',
          cantidadPersonas: 2,
        });

      expect(res.status).toBe(401);
    });

    it('Debe permitir la creación de reservación a cualquier usuario autenticado (CLIENTE)', async () => {
      const tokenCliente = generarToken(RolUsuario.CLIENTE);

      const res = await request(app.getHttpServer())
        .post('/reservaciones')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({
          fecha: '2026-11-01',
          horaInicio: '10:00',
          horaFin: '11:00',
          espacioId: 'espacio-1',
          usuarioId: 'usuario-1',
          cantidadPersonas: 2,
        });

      expect(res.status).toBe(201);
    });
  });
  describe('Endpoints nuevos (búsqueda, disponibilidad, multi-día, edición, listado admin y pagos)', () => {
    const cuerpoMultiple = {
      fechas: ['2030-01-07', '2030-01-08'],
      horaInicio: '10:00',
      horaFin: '12:00',
      espacioId: 'espacio-1',
      cantidadPersonas: 2,
    };

    it('GET /espacios con filtros y GET /espacios/:id/disponibilidad son públicos (200)', async () => {
      const busqueda = await request(app.getHttpServer()).get('/espacios?fecha=2030-01-07&capacidad=4&tipo=Sala');
      expect(busqueda.status).toBe(200);
      const disp = await request(app.getHttpServer()).get('/espacios/espacio-1/disponibilidad?fecha=2030-01-07');
      expect(disp.status).toBe(200);
    });

    it('rechaza filtros inválidos con HTTP 400', async () => {
      const res = await request(app.getHttpServer()).get('/espacios?tipo=Hangar&capacidad=abc');
      expect(res.status).toBe(400);
      const sinFecha = await request(app.getHttpServer()).get('/espacios/espacio-1/disponibilidad');
      expect(sinFecha.status).toBe(400);
    });

    it.each([
      ['patch', '/espacios/espacio-1', { nombre: 'Nuevo' }],
      ['put', '/espacios/espacio-1/horarios', { horarios: [{ diaSemana: 1, horaApertura: '09:00', horaCierre: '18:00' }] }],
      ['get', '/reservaciones?fecha=2030-01-07', undefined],
      ['patch', '/pagos/pago-1/completar', undefined],
    ] as const)('%s %s: 401 sin token, 403 con CLIENTE, 200 con ADMIN', async (metodo, ruta, cuerpo) => {
      const llamar = (token?: string) => {
        let r = (request(app.getHttpServer()) as any)[metodo](ruta);
        if (token) r = r.set('Authorization', `Bearer ${token}`);
        return cuerpo ? r.send(cuerpo) : r;
      };
      expect((await llamar()).status).toBe(401);
      expect((await llamar(generarToken(RolUsuario.CLIENTE))).status).toBe(403);
      expect((await llamar(generarToken(RolUsuario.ADMIN))).status).toBe(200);
    });

    it('POST /reservaciones/multiples exige token y valida el cuerpo', async () => {
      const sinToken = await request(app.getHttpServer()).post('/reservaciones/multiples').send(cuerpoMultiple);
      expect(sinToken.status).toBe(401);

      const token = generarToken(RolUsuario.CLIENTE);
      const ok = await request(app.getHttpServer()).post('/reservaciones/multiples').set('Authorization', `Bearer ${token}`).send(cuerpoMultiple);
      expect(ok.status).toBe(201);
      expect(ok.body).toEqual(expect.objectContaining({ cantidad: 2, total: 400 }));

      const vacio = await request(app.getHttpServer()).post('/reservaciones/multiples').set('Authorization', `Bearer ${token}`).send({ ...cuerpoMultiple, fechas: [] });
      expect(vacio.status).toBe(400);
    });

    it('POST /pagos exige token; TARJETA exige referencia y EFECTIVO no', async () => {
      const cuerpo = { reservacionIds: ['res-1'], metodo: 'TARJETA' };
      expect((await request(app.getHttpServer()).post('/pagos').send(cuerpo)).status).toBe(401);

      const token = generarToken(RolUsuario.CLIENTE);
      const sinReferencia = await request(app.getHttpServer()).post('/pagos').set('Authorization', `Bearer ${token}`).send(cuerpo);
      expect(sinReferencia.status).toBe(400);

      const conReferencia = await request(app.getHttpServer()).post('/pagos').set('Authorization', `Bearer ${token}`).send({ ...cuerpo, referencia: 'AUT-123' });
      expect(conReferencia.status).toBe(201);

      const efectivo = await request(app.getHttpServer()).post('/pagos').set('Authorization', `Bearer ${token}`).send({ reservacionIds: ['res-1'], metodo: 'EFECTIVO' });
      expect(efectivo.status).toBe(201);
    });

    it('GET /sedes es público y devuelve la lista de sedes (200)', async () => {
      const res = await request(app.getHttpServer()).get('/sedes');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 'sede-1', nombre: 'Sede Principal' }]);
    });

    it.each([
      ['get', '/dashboard/resumen', undefined],
      ['patch', '/espacios/espacio-1/bloqueos/bloq-1/desactivar', undefined],
      ['get', '/pagos', undefined],
      ['get', '/usuarios', undefined],
    ] as const)('Backoffice %s %s: 401 sin token, 403 con CLIENTE, 200 con ADMIN', async (metodo, ruta, cuerpo) => {
      const llamar = (token?: string) => {
        let r = (request(app.getHttpServer()) as any)[metodo](ruta);
        if (token) r = r.set('Authorization', `Bearer ${token}`);
        return cuerpo ? r.send(cuerpo) : r;
      };
      expect((await llamar()).status).toBe(401);
      expect((await llamar(generarToken(RolUsuario.CLIENTE))).status).toBe(403);
      expect((await llamar(generarToken(RolUsuario.ADMIN))).status).toBe(200);
    });

    it('PATCH /usuarios/:id y /usuarios/:id/estado son exclusivos de ADMIN y nunca devuelven contraseña', async () => {
      const tokenCliente = generarToken(RolUsuario.CLIENTE);
      const tokenAdmin = generarToken(RolUsuario.ADMIN);

      expect((await request(app.getHttpServer()).patch('/usuarios/u1').set('Authorization', `Bearer ${tokenCliente}`).send({ nombre: 'X' })).status).toBe(403);
      expect((await request(app.getHttpServer()).patch('/usuarios/u1/estado').set('Authorization', `Bearer ${tokenCliente}`).send({ activo: false })).status).toBe(403);

      const editado = await request(app.getHttpServer()).patch('/usuarios/u1').set('Authorization', `Bearer ${tokenAdmin}`).send({ nombre: 'Editado' });
      expect(editado.status).toBe(200);
      expect(editado.body.contrasena).toBeUndefined();

      const invalido = await request(app.getHttpServer()).patch('/usuarios/u1/estado').set('Authorization', `Bearer ${tokenAdmin}`).send({ activo: 'quizá' });
      expect(invalido.status).toBe(400);
    });

    it('rechaza con 401 la credencial de una cuenta que fue desactivada', async () => {
      const tokenCliente = generarToken(RolUsuario.CLIENTE);
      const original = mockUsuariosService.obtenerEstadoSesion;
      mockUsuariosService.obtenerEstadoSesion = () => Promise.resolve({ activo: false, rol: RolUsuario.CLIENTE });
      try {
        const res = await request(app.getHttpServer()).get('/usuarios/usuario-test-id').set('Authorization', `Bearer ${tokenCliente}`);
        expect(res.status).toBe(401);
      } finally {
        mockUsuariosService.obtenerEstadoSesion = original;
      }
    });

    it('GET /usuarios/:id permite ADMIN para cualquiera y CLIENTE solo sobre sí mismo', async () => {
      const tokenCliente = generarToken(RolUsuario.CLIENTE);
      const tokenAdmin = generarToken(RolUsuario.ADMIN);

      expect((await request(app.getHttpServer()).get('/usuarios/otro-id').set('Authorization', `Bearer ${tokenCliente}`)).status).toBe(403);

      const propio = await request(app.getHttpServer()).get('/usuarios/usuario-test-id').set('Authorization', `Bearer ${tokenCliente}`);
      expect(propio.status).toBe(200);
      expect(propio.body.contrasena).toBeUndefined();

      const adminRes = await request(app.getHttpServer()).get('/usuarios/otro-id').set('Authorization', `Bearer ${tokenAdmin}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.contrasena).toBeUndefined();
    });

    it('GET /reservaciones?page=1&limit=10 devuelve respuesta paginada para ADMIN', async () => {
      const tokenAdmin = generarToken(RolUsuario.ADMIN);
      const res = await request(app.getHttpServer())
        .get('/reservaciones?page=1&limit=10')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        items: [{ id: 'res-1' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });
});
