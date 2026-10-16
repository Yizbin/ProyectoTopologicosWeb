import { describe, it, expect, vi } from 'vitest';
import { ArgumentsHost, BadRequestException, ForbiddenException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { DominioExceptionFilter } from './dominio-exception.filter.js';
import {
  DominioError,
  EmpalmeReservacionError,
  FueraDeHorarioError,
  BloqueoAdministrativoError,
} from '../../dominio/errores/dominio.errors.js';

describe('DominioExceptionFilter', () => {
  const filter = new DominioExceptionFilter();

  function createMockHost(url = '/reservaciones') {
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const responseMock = { status: statusMock };
    const requestMock = { url };

    const hostMock = {
      switchToHttp: () => ({
        getResponse: () => responseMock,
        getRequest: () => requestMock,
      }),
    } as unknown as ArgumentsHost;

    return { hostMock, statusMock, jsonMock };
  }

  it('debe atrapar DominioError base y retornar HTTP 409 Conflict', () => {
    const { hostMock, statusMock, jsonMock } = createMockHost();
    const error = new DominioError('Error de regla de negocio');

    filter.catch(error, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 409,
        error: 'Conflict',
        message: 'Error de regla de negocio',
        tipoError: 'DominioError',
        path: '/reservaciones',
      }),
    );
  });

  it('debe atrapar EmpalmeReservacionError y retornar HTTP 409 con el mensaje correspondiente', () => {
    const { hostMock, statusMock, jsonMock } = createMockHost();
    const error = new EmpalmeReservacionError();

    filter.catch(error, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 409,
        message: error.message,
        tipoError: 'EmpalmeReservacionError',
      }),
    );
  });

  it('debe atrapar FueraDeHorarioError y retornar HTTP 409', () => {
    const { hostMock, statusMock, jsonMock } = createMockHost();
    const error = new FueraDeHorarioError();

    filter.catch(error, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 409,
        tipoError: 'FueraDeHorarioError',
      }),
    );
  });

  it('debe atrapar BloqueoAdministrativoError y retornar HTTP 409', () => {
    const { hostMock, statusMock, jsonMock } = createMockHost();
    const error = new BloqueoAdministrativoError();

    filter.catch(error, hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 409,
        tipoError: 'BloqueoAdministrativoError',
      }),
    );
  });

  it.each([
    [new BadRequestException(['El nombre es obligatorio']), 400, 'El nombre es obligatorio'],
    [new UnauthorizedException('Token inválido'), 401, 'Token inválido'],
    [new ForbiddenException('Acceso denegado'), 403, 'Acceso denegado'],
  ])('normaliza errores HTTP conservando su estado y mensaje', (error, status, message) => {
    const { hostMock, statusMock, jsonMock } = createMockHost();

    filter.catch(error, hostMock);

    expect(statusMock).toHaveBeenCalledWith(status);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: status,
      message,
      timestamp: expect.any(String),
      path: '/reservaciones',
    }));
  });

  it('no expone el detalle de errores internos inesperados', () => {
    const { hostMock, statusMock, jsonMock } = createMockHost();

    filter.catch(new Error('detalle secreto'), hostMock);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: 500,
      message: 'Error interno del servidor.',
    }));
  });
});
