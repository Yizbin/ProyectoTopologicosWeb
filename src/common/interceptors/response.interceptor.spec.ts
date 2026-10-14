import { describe, it, expect } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { ResponseInterceptor } from './response.interceptor.js';

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  it('debe estandarizar la respuesta con success, data, timestamp y durationMs', async () => {
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of({ id: '123', nombre: 'Sala A' }),
    };

    const observable = interceptor.intercept(mockContext, mockCallHandler);
    const resultado = await firstValueFrom(observable);

    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual({ id: '123', nombre: 'Sala A' });
    expect(typeof resultado.timestamp).toBe('string');
    expect(typeof resultado.durationMs).toBe('number');
    expect(resultado.durationMs).toBeGreaterThanOrEqual(0);
  });
});
