import { Module } from '@nestjs/common';
import { ReservacionPrismaRepository } from './infraestructura/reservacion.prisma.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RESERVACION_REPO_TOKEN } from '../tokens/tokens.js';

@Module({
  imports: [PrismaModule],
  providers: [{ provide: RESERVACION_REPO_TOKEN, useClass: ReservacionPrismaRepository }],
  exports: [RESERVACION_REPO_TOKEN],
})
export class ReservacionesRepoModule {}