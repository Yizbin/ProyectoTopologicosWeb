import { afterEach, describe, expect, it } from 'vitest';
import { obtenerOrigenesCors } from './cors.config.js';

describe('obtenerOrigenesCors', () => {
  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  it('lee y normaliza una lista de orígenes configurados', () => {
    expect(obtenerOrigenesCors(' http://localhost:5173, https://app.example.com ,, ')).toEqual([
      'http://localhost:5173',
      'https://app.example.com',
    ]);
  });

  it('no permite orígenes cruzados si no hay configuración', () => {
    expect(obtenerOrigenesCors('')).toEqual([]);
    expect(obtenerOrigenesCors(undefined)).toEqual([]);
  });
});
