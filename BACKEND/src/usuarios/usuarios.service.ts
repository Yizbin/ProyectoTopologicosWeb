import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto.js';
import { Usuario, RolUsuario } from '../dominio/entidades/usuario.entity.js';

const SALT_ROUNDS = 10;

type UsuarioRow = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
  rol: string;
  activo?: boolean | null;
};

function aEntidad(row: UsuarioRow): Usuario {
  return new Usuario(
    row.id,
    row.nombre,
    row.correo,
    row.telefono,
    row.contrasena,
    row.rol as RolUsuario,
    row.activo !== false,
  );
}

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async crearUsuario(dto: CrearUsuarioDto): Promise<Usuario> {
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });

    if (usuarioExistente) {
      throw new ConflictException(`El correo ${dto.correo} ya se encuentra registrado.`);
    }

    const contrasenaHasheada = await bcrypt.hash(dto.contrasena, SALT_ROUNDS);

    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        telefono: dto.telefono,
        contrasena: contrasenaHasheada,
        rol: (dto.rol as RolUsuario) ?? RolUsuario.CLIENTE,
      },
    });

    return aEntidad(nuevoUsuario);
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({
      where: { correo },
    });

    return row ? aEntidad(row) : null;
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const row = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!row) {
      throw new NotFoundException(`El usuario con ID ${id} no fue encontrado.`);
    }

    return aEntidad(row);
  }

  /** Datos mínimos para revalidar una sesión en cada petición autenticada. */
  async obtenerEstadoSesion(id: string): Promise<{ activo: boolean; rol: RolUsuario } | null> {
    const row = await this.prisma.usuario.findUnique({
      where: { id },
      select: { activo: true, rol: true },
    });
    if (!row) return null;
    return { activo: row.activo !== false, rol: row.rol as RolUsuario };
  }

  async actualizarUsuario(
    id: string,
    dto: ActualizarUsuarioDto,
    solicitanteId: string,
  ): Promise<Usuario> {
    const actual = await this.buscarPorId(id);

    if (dto.correo && dto.correo !== actual.correo) {
      const otro = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
      if (otro && otro.id !== id) {
        throw new ConflictException(
          `El correo ${dto.correo} ya está registrado por otro usuario.`,
        );
      }
    }

    const pierdeRolAdmin =
      dto.rol !== undefined &&
      actual.rol === RolUsuario.ADMIN &&
      dto.rol !== RolUsuario.ADMIN;

    if (pierdeRolAdmin) {
      if (id === solicitanteId) {
        throw new ConflictException(
          'No puedes quitarte a ti mismo el rol de administrador. Pide a otro administrador que lo haga.',
        );
      }
      if (actual.activo) {
        await this.asegurarQueQuedeOtroAdminActivo(id);
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.correo !== undefined) data.correo = dto.correo.trim();
    if (dto.telefono !== undefined) data.telefono = dto.telefono.trim();
    if (dto.rol !== undefined) data.rol = dto.rol;
    if (dto.contrasena) data.contrasena = await bcrypt.hash(dto.contrasena, SALT_ROUNDS);

    const row = await this.prisma.usuario.update({ where: { id }, data });
    return aEntidad(row);
  }

  async cambiarEstado(id: string, activo: boolean, solicitanteId: string): Promise<Usuario> {
    const actual = await this.buscarPorId(id);

    if (!activo) {
      if (id === solicitanteId) {
        throw new ConflictException(
          'No puedes desactivar tu propia cuenta mientras tienes la sesión abierta.',
        );
      }
      if (actual.rol === RolUsuario.ADMIN && actual.activo) {
        await this.asegurarQueQuedeOtroAdminActivo(id);
      }
    }

    if (actual.activo === activo) {
      return actual;
    }

    const row = await this.prisma.usuario.update({ where: { id }, data: { activo } });
    return aEntidad(row);
  }

  async listarUsuarios(
    filtros: { busqueda?: string; rol?: RolUsuario; activo?: boolean } = {},
  ): Promise<Omit<Usuario, 'contrasena'>[]> {
    const where: Record<string, unknown> = {};
    if (filtros.rol) where.rol = filtros.rol;
    if (filtros.activo !== undefined) where.activo = filtros.activo;

    const rows = await this.prisma.usuario.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });

    const termino = filtros.busqueda?.trim().toLowerCase();

    return rows
      .filter((r) => {
        if (!termino) return true;
        return (
          r.nombre.toLowerCase().includes(termino) ||
          r.correo.toLowerCase().includes(termino) ||
          r.telefono.toLowerCase().includes(termino)
        );
      })
      .map((r) => ({
        id: r.id,
        nombre: r.nombre,
        correo: r.correo,
        telefono: r.telefono,
        rol: r.rol as RolUsuario,
        activo: r.activo !== false,
      }));
  }

  private async asegurarQueQuedeOtroAdminActivo(idExcluido: string): Promise<void> {
    const otrosAdmins = await this.prisma.usuario.count({
      where: { rol: RolUsuario.ADMIN, activo: true, id: { not: idExcluido } },
    });
    if (otrosAdmins === 0) {
      throw new ConflictException(
        'Es el único administrador activo: el panel se quedaría sin nadie que lo opere. Crea o activa otro administrador primero.',
      );
    }
  }
}
