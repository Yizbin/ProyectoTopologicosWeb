import './config/load-env.js';
import { obtenerObserveConfig } from './config/observe.config.js';
import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EspaciosModule } from './espacios/espacios.module.js';
import { ReservacionesModule } from './reservaciones/reservaciones.module.js';
import { PagosModule } from './pagos/pagos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot(obtenerObserveConfig()),
    PrismaModule,
    UsuariosModule,
    AuthModule,
    EspaciosModule,
    ReservacionesModule,
    PagosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 