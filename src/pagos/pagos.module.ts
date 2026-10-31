import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller.js';
import { PagosService } from './pagos.service.js';
import { PagoPrismaRepository } from './infraestructura/pago.prisma.repository.js';
import { ReservacionesRepoModule } from '../reservaciones/reservaciones-repo.module.js';
import { PAGO_REPO_TOKEN } from '../tokens/tokens.js';

@Module({
  imports: [ReservacionesRepoModule],
  controllers: [PagosController],
  providers: [
    PagosService,
    { provide: PAGO_REPO_TOKEN, useClass: PagoPrismaRepository },
  ],
})
export class PagosModule {}