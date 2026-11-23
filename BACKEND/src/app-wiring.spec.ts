import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { EspaciosModule } from './espacios/espacios.module.js';
import { ReservacionesModule } from './reservaciones/reservaciones.module.js';
import { PagosModule } from './pagos/pagos.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { EspaciosService } from './espacios/espacios.service.js';
import { ReservacionesService } from './reservaciones/reservaciones.service.js';
import { PagosService } from './pagos/pagos.service.js';
import { UsuariosService } from './usuarios/usuarios.service.js';
import { DashboardService } from './dashboard/dashboard.service.js';

describe('Cableado de módulos (inyección de dependencias)', () => {
  it('EspaciosModule, ReservacionesModule, PagosModule, UsuariosModule y DashboardModule resuelven sus dependencias sin ciclos', async () => {
    const modulo = await Test.createTestingModule({
      imports: [EspaciosModule, ReservacionesModule, PagosModule, UsuariosModule, DashboardModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(modulo.get(EspaciosService)).toBeDefined();
    expect(modulo.get(ReservacionesService)).toBeDefined();
    expect(modulo.get(PagosService)).toBeDefined();
    expect(modulo.get(UsuariosService)).toBeDefined();
    expect(modulo.get(DashboardService)).toBeDefined();
  });
});