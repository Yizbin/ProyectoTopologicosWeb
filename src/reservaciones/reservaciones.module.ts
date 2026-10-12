import { Module } from '@nestjs/common';
import { ReservacionesController } from './reservaciones.controller.js';
import { ReservacionesService } from './reservaciones.service.js'; 
import { ReservacionMemoryRepository } from './infraestructura/reservacion.memory.repository.js';
import { EspaciosModule } from '../espacios/espacios.module.js'; 
import { RESERVACION_REPO_TOKEN } from '../tokens/tokens.js';

@Module({
  imports: [EspaciosModule], 
  controllers: [ReservacionesController],
  providers: [
    ReservacionesService,
    {
      provide: RESERVACION_REPO_TOKEN,
      useClass: ReservacionMemoryRepository,
    },
  ],
})
export class ReservacionesModule {}