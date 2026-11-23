import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { ListarUsuariosQueryDto } from './dto/listar-usuarios-query.dto.js';
import { paginarLista, type ResultadoPaginado } from '../common/utils/paginacion.util.js';
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

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear un usuario desde administración (Solo ADMIN)' })
  async crearUsuario(@Body() dto: CrearUsuarioDto): Promise<UsuarioPublico> {
    const creado = await this.usuariosService.crearUsuario(dto);
    return sinContrasena(creado);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Listar usuarios sin contraseña, con filtro por rol y búsqueda (Solo ADMIN)' })
  async listarUsuarios(
    @Query() query: ListarUsuariosQueryDto,
  ): Promise<UsuarioPublico[] | ResultadoPaginado<UsuarioPublico>> {
    const lista = await this.usuariosService.listarUsuarios({
      rol: query.rol,
      busqueda: query.busqueda ?? query.q,
    });

    if (query.page !== undefined || query.limit !== undefined) {
      return paginarLista(lista, query.page, query.limit);
    }

    return lista;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener detalle de un usuario sin contraseña' })
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
