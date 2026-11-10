import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';

describe('Security Guards', () => {
  describe('JwtAuthGuard', () => {
    const guard = new JwtAuthGuard();

    it('debe lanzar UnauthorizedException (HTTP 401) si no hay usuario o hay error', () => {
      const mockContext = {} as ExecutionContext;

      expect(() => {
        guard.handleRequest(null, null, { message: 'jwt must be provided' }, mockContext);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(new Error('Token expired'), null, null, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('debe devolver el usuario si la autenticación por token es válida', () => {
      const mockContext = {} as ExecutionContext;
      const validUser = { id: 'usr-1', correo: 'admin@correo.com', rol: RolUsuario.ADMIN };

      const result = guard.handleRequest(null, validUser, null, mockContext);
      expect(result).toBe(validUser);
    });
  });

  describe('RolesGuard', () => {
    function createMockContext(user: any) {
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as unknown as ExecutionContext;
    }

    it('debe permitir acceso si la ruta no tiene roles requeridos', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      } as unknown as Reflector;

      const rolesGuard = new RolesGuard(reflector);
      const context = createMockContext(null);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('debe lanzar UnauthorizedException (HTTP 401) si la ruta requiere roles pero no hay usuario en la petición', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue([RolUsuario.ADMIN]),
      } as unknown as Reflector;

      const rolesGuard = new RolesGuard(reflector);
      const context = createMockContext(null);

      expect(() => rolesGuard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('debe lanzar ForbiddenException (HTTP 403) si un usuario con rol CLIENTE intenta acceder a un endpoint con @Roles(ADMIN)', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue([RolUsuario.ADMIN]),
      } as unknown as Reflector;

      const rolesGuard = new RolesGuard(reflector);
      const clienteUser = { id: 'usr-cliente', rol: RolUsuario.CLIENTE };
      const context = createMockContext(clienteUser);

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debe permitir el acceso si el usuario cuenta con el rol ADMIN requerido', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue([RolUsuario.ADMIN]),
      } as unknown as Reflector;

      const rolesGuard = new RolesGuard(reflector);
      const adminUser = { id: 'usr-admin', rol: RolUsuario.ADMIN };
      const context = createMockContext(adminUser);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });
});
