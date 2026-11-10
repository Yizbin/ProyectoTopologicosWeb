import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RolUsuario, Usuario } from '../dominio/entidades/usuario.entity.js';

type UsuarioPublico = Omit<Usuario, 'contrasena'>;

function sinContrasena(usuario: Usuario): UsuarioPublico {
  const { contrasena: _omitida, ...resto } = usuario;
  return resto;
}

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async crearUsuario(@Body() dto: CrearUsuarioDto): Promise<UsuarioPublico> {
    const creado = await this.usuariosService.crearUsuario(dto);
    return sinContrasena(creado);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async listarUsuarios(): Promise<UsuarioPublico[]> {
    return this.usuariosService.listarUsuarios();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; rol: RolUsuario },
  ): Promise<UsuarioPublico> {
    if (user.rol !== RolUsuario.ADMIN && user.id !== id) {
      throw new ForbiddenException('No puedes consultar los datos de otro usuario.');
    }
    const usuario = await this.usuariosService.buscarPorId(id);
    return sinContrasena(usuario);
  }
}
