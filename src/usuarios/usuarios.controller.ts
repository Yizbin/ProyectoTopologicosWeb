import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolUsuario, Usuario } from '../dominio/entidades/usuario.entity.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  async crearUsuario(@Body() dto: CrearUsuarioDto): Promise<Usuario> {
    return this.usuariosService.crearUsuario(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async listarUsuarios(): Promise<Omit<Usuario, 'contrasena'>[]> {
    return this.usuariosService.listarUsuarios();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(@Param('id') id: string): Promise<Usuario> {
    return this.usuariosService.buscarPorId(id);
  }
}
