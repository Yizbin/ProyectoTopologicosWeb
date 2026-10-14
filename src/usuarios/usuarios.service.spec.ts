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
});
