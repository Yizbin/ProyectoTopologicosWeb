import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { UsuariosService } from './usuarios.service.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';

describe('UsuariosService', () => {
  let usuariosService: UsuariosService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      usuario: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    };
    usuariosService = new UsuariosService(mockPrisma);
  });

  it('debe encriptar la contraseña con bcrypt.hash antes de persistir el usuario en la BD', async () => {
    const rawContrasena = 'secreto123';
    mockPrisma.usuario.findUnique.mockResolvedValue(null);
    mockPrisma.usuario.create.mockImplementation((args: any) => {
      return Promise.resolve({
        id: 'usr-1',
        ...args.data,
      });
    });

    const creado = await usuariosService.crearUsuario({
      nombre: 'Carlos Admin',
      correo: 'admin@correo.com',
      telefono: '555-4321',
      contrasena: rawContrasena,
      rol: RolUsuario.ADMIN,
    });

    expect(creado.contrasena).not.toBe(rawContrasena);
    const esHashValido = await bcrypt.compare(rawContrasena, creado.contrasena);
    expect(esHashValido).toBe(true);

    expect(mockPrisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          correo: 'admin@correo.com',
          rol: RolUsuario.ADMIN,
          contrasena: expect.any(String),
        }),
      }),
    );
  });

  it('lista usuarios sin contraseña filtrando por rol y texto de búsqueda', async () => {
    mockPrisma.usuario.findMany.mockResolvedValue([
      { id: 'u1', nombre: 'Ana Cliente', correo: 'ana@correo.com', telefono: '555-1111', rol: RolUsuario.CLIENTE },
      { id: 'u2', nombre: 'Luis Admin', correo: 'luis@correo.com', telefono: '555-2222', rol: RolUsuario.ADMIN },
    ]);

    const filtrados = await usuariosService.listarUsuarios({ busqueda: 'ana' });
    expect(filtrados).toEqual([
      { id: 'u1', nombre: 'Ana Cliente', correo: 'ana@correo.com', telefono: '555-1111', rol: RolUsuario.CLIENTE, activo: true },
    ]);
    expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, nombre: true, correo: true, telefono: true, rol: true, activo: true },
      }),
    );
  });

  describe('edición y desactivación', () => {
    const admin = {
      id: 'adm-1', nombre: 'Admin', correo: 'admin@correo.com', telefono: '555',
      contrasena: 'hash', rol: RolUsuario.ADMIN, activo: true,
    };
    const cliente = {
      id: 'cli-1', nombre: 'Cliente', correo: 'cli@correo.com', telefono: '555',
      contrasena: 'hash', rol: RolUsuario.CLIENTE, activo: true,
    };

    it('actualiza datos y vuelve a encriptar la contraseña si se envía una nueva', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(cliente);
      mockPrisma.usuario.update.mockImplementation((args: any) =>
        Promise.resolve({ ...cliente, ...args.data }),
      );

      const r = await usuariosService.actualizarUsuario(
        'cli-1', { nombre: ' Nuevo ', contrasena: 'otra123' }, 'adm-1',
      );

      expect(r.nombre).toBe('Nuevo');
      expect(await bcrypt.compare('otra123', r.contrasena)).toBe(true);
    });

    it('rechaza un correo que ya usa otro usuario', async () => {
      mockPrisma.usuario.findUnique
        .mockResolvedValueOnce(cliente)
        .mockResolvedValueOnce({ ...admin });

      await expect(
        usuariosService.actualizarUsuario('cli-1', { correo: 'admin@correo.com' }, 'adm-1'),
      ).rejects.toThrow(/ya está registrado/);
      expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
    });

    it('impide que un administrador se quite su propio rol', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(admin);
      await expect(
        usuariosService.actualizarUsuario('adm-1', { rol: RolUsuario.CLIENTE }, 'adm-1'),
      ).rejects.toThrow(/ti mismo/);
    });

    it('impide desactivar la propia cuenta', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(admin);
      await expect(usuariosService.cambiarEstado('adm-1', false, 'adm-1')).rejects.toThrow(
        /propia cuenta/,
      );
    });

    it('impide desactivar al último administrador activo', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(admin);
      mockPrisma.usuario.count.mockResolvedValue(0);
      await expect(usuariosService.cambiarEstado('adm-1', false, 'adm-2')).rejects.toThrow(
        /único administrador activo/,
      );
      expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
    });

    it('desactiva y reactiva a un cliente', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(cliente);
      mockPrisma.usuario.update.mockImplementation((args: any) =>
        Promise.resolve({ ...cliente, ...args.data }),
      );
      const r = await usuariosService.cambiarEstado('cli-1', false, 'adm-1');
      expect(r.activo).toBe(false);
      expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
        where: { id: 'cli-1' },
        data: { activo: false },
      });
    });
  });
});
