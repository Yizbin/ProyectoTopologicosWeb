import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EspaciosController } from '../espacios/espacios.controller.js';
import { EspaciosService } from '../espacios/espacios.service.js';
import { ReservacionesController } from '../reservaciones/reservaciones.controller.js';
import { ReservacionesService } from '../reservaciones/reservaciones.service.js';
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
    listarEspacios: () => Promise.resolve([{ id: 'espacio-1', nombre: 'Sala VIP' }]),
    obtenerEspacioPorId: () => Promise.resolve({ id: 'espacio-1', nombre: 'Sala VIP' }),
    obtenerHorarios: () => Promise.resolve([]),
    obtenerBloqueos: () => Promise.resolve([]),
  };

  const mockReservacionesService = {
    crearReservacion: () => Promise.resolve({ id: 'res-1' }),
    obtenerPorId: () => Promise.resolve({ id: 'res-1' }),
    obtenerHistorialCliente: () => Promise.resolve([]),
    confirmarReservacion: () => Promise.resolve(),
    completarReservacion: () => Promise.resolve(),
    cancelarReservacion: () => Promise.resolve(),
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
      controllers: [EspaciosController, ReservacionesController],
      providers: [
        JwtStrategy,
        RolesGuard,
        { provide: EspaciosService, useValue: mockEspaciosService },
        { provide: ReservacionesService, useValue: mockReservacionesService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DominioExceptionFilter());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  const generarToken = (rol: RolUsuario) => {
    return jwtService.sign({
      sub: 'usuario-test-id',
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
          fecha: '2026-11-01T10:00:00.000Z',
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
          fecha: '2026-11-01T10:00:00.000Z',
          horaInicio: '10:00',
          horaFin: '11:00',
          espacioId: 'espacio-1',
          usuarioId: 'usuario-1',
          cantidadPersonas: 2,
        });

      expect(res.status).toBe(201);
    });
  });
});
