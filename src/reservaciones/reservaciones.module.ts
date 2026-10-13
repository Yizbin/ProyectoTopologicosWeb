import { Module } from '@nestjs/common';
import { ReservacionesController } from './reservaciones.controller.js';
import { ReservacionesService } from './reservaciones.service.js';
import { ReservacionPrismaRepository } from './infraestructura/reservacion.prisma.repository.js';
import { EspaciosModule } from '../espacios/espacios.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RESERVACION_REPO_TOKEN } from '../tokens/tokens.js';

@Module({
  imports: [EspaciosModule, PrismaModule],
  controllers: [ReservacionesController],
  providers: [
    ReservacionesService,
    {
      provide: RESERVACION_REPO_TOKEN,
      useClass: ReservacionPrismaRepository,
    },
  ],
})
export class ReservacionesModule {}