import { Module } from '@nestjs/common';
import { EspaciosController } from './espacios.controller.js';
import { EspaciosService } from './espacios.service.js';
import { EspacioPrismaRepository } from './infraestructura/espacio.prisma.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ESPACIO_REPO_TOKEN } from '../tokens/tokens.js';

@Module({
  imports: [PrismaModule],
  controllers: [EspaciosController],
  providers: [
    EspaciosService,
    {
      provide: ESPACIO_REPO_TOKEN,
      useClass: EspacioPrismaRepository,
    },
  ],
  exports: [ESPACIO_REPO_TOKEN],
})
export class EspaciosModule {}