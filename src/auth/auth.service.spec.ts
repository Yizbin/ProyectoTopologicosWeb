import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { Usuario, RolUsuario } from '../dominio/entidades/usuario.entity.js';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsuariosService: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockUsuariosService = {
      buscarPorCorreo: vi.fn(),
      crearUsuario: vi.fn(),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mocked_jwt_token_123'),
    };

    authService = new AuthService(mockUsuariosService, mockJwtService);
  });

  it('debe iniciar sesión exitosamente si las credenciales son válidas y devolver el token JWT', async () => {
    const rawPassword = 'password123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const usuarioMock = new Usuario(
      'user-1',
      'Juan Pérez',
      'juan@correo.com',
      '555-1234',
      hashedPassword,
      RolUsuario.CLIENTE,
    );

    mockUsuariosService.buscarPorCorreo.mockResolvedValue(usuarioMock);

    const resultado = await authService.login({
      correo: 'juan@correo.com',
      contrasena: rawPassword,
    });

    expect(resultado.access_token).toBe('mocked_jwt_token_123');
    expect(resultado.usuario).toEqual({
      id: 'user-1',
      nombre: 'Juan Pérez',
      correo: 'juan@correo.com',
      rol: RolUsuario.CLIENTE,
    });
    expect(mockJwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        correo: 'juan@correo.com',
        rol: RolUsuario.CLIENTE,
      }),
    );
  });

  it('debe rechazar el login con UnauthorizedException si la contraseña no coincide', async () => {
    const hashedPassword = await bcrypt.hash('correct_password', 10);
    const usuarioMock = new Usuario(
      'user-1',
      'Juan Pérez',
      'juan@correo.com',
      '555-1234',
      hashedPassword,
      RolUsuario.CLIENTE,
    );

    mockUsuariosService.buscarPorCorreo.mockResolvedValue(usuarioMock);

    await expect(
      authService.login({
        correo: 'juan@correo.com',
        contrasena: 'wrong_password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe rechazar el login con UnauthorizedException si el usuario no existe', async () => {
    mockUsuariosService.buscarPorCorreo.mockResolvedValue(null);

    await expect(
      authService.login({
        correo: 'inexistente@correo.com',
        contrasena: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe registrar un usuario y generar un token JWT en el endpoint de registro', async () => {
    const usuarioCreado = new Usuario(
      'user-nuevo',
      'Ana Gómez',
      'ana@correo.com',
      '555-9876',
      'hashed_pwd',
      RolUsuario.CLIENTE,
    );

    mockUsuariosService.crearUsuario.mockResolvedValue(usuarioCreado);

    const resultado = await authService.registro({
      nombre: 'Ana Gómez',
      correo: 'ana@correo.com',
      telefono: '555-9876',
      contrasena: 'miPasswordSeguro',
      rol: RolUsuario.CLIENTE,
    });

    expect(resultado.access_token).toBe('mocked_jwt_token_123');
    expect(resultado.usuario.correo).toBe('ana@correo.com');
    expect(mockUsuariosService.crearUsuario).toHaveBeenCalled();
  });
});
