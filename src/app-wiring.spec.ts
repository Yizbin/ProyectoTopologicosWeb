import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { EspaciosModule } from './espacios/espacios.module.js';
import { ReservacionesModule } from './reservaciones/reservaciones.module.js';
import { PagosModule } from './pagos/pagos.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { EspaciosService } from './espacios/espacios.service.js';
import { ReservacionesService } from './reservaciones/reservaciones.service.js';
import { PagosService } from './pagos/pagos.service.js';

describe('Cableado de módulos (inyección de dependencias)', () => {
  it('EspaciosModule, ReservacionesModule y PagosModule resuelven sus dependencias sin ciclos', async () => {
    const modulo = await Test.createTestingModule({
      imports: [EspaciosModule, ReservacionesModule, PagosModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(modulo.get(EspaciosService)).toBeDefined();
    expect(modulo.get(ReservacionesService)).toBeDefined();
    expect(modulo.get(PagosService)).toBeDefined();
  });
});