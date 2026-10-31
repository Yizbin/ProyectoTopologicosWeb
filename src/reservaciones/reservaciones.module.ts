import { Module } from '@nestjs/common';
import { ReservacionesController } from './reservaciones.controller.js';
import { ReservacionesService } from './reservaciones.service.js';
import { ReservacionesRepoModule } from './reservaciones-repo.module.js';
import { EspaciosModule } from '../espacios/espacios.module.js';

@Module({
  imports: [EspaciosModule, ReservacionesRepoModule],
  controllers: [ReservacionesController],
  providers: [ReservacionesService],
  exports: [ReservacionesService],
})
export class ReservacionesModule {}