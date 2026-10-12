import { Module } from '@nestjs/common';
import { EspaciosController } from './espacios.controller.js';
import { EspaciosService } from './espacios.service.js';
import { EspacioMemoryRepository } from '../espacios/infraestructura/espacio.memory.repository.js';
import { ESPACIO_REPO_TOKEN } from '../tokens/tokens.js';

@Module({
  controllers: [EspaciosController],
  providers: [
    EspaciosService,
    {
      provide: ESPACIO_REPO_TOKEN,
      useClass: EspacioMemoryRepository, 
    },
  ],
  exports: [ESPACIO_REPO_TOKEN], 
})
export class EspaciosModule {}