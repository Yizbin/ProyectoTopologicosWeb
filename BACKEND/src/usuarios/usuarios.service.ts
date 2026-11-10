import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { Usuario, RolUsuario } from '../dominio/entidades/usuario.entity.js';

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

    const saltRounds = 10;
    const contrasenaHasheada = await bcrypt.hash(dto.contrasena, saltRounds);

    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        telefono: dto.telefono,
        contrasena: contrasenaHasheada,
        rol: (dto.rol as RolUsuario) ?? RolUsuario.CLIENTE,
      },
    });

    return new Usuario(
      nuevoUsuario.id,
      nuevoUsuario.nombre,
      nuevoUsuario.correo,
      nuevoUsuario.telefono,
      nuevoUsuario.contrasena,
      nuevoUsuario.rol as RolUsuario,
    );
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({
      where: { correo },
    });

    if (!row) return null;

    return new Usuario(
      row.id,
      row.nombre,
      row.correo,
      row.telefono,
      row.contrasena,
      row.rol as RolUsuario,
    );
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const row = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!row) {
      throw new NotFoundException(`El usuario con ID ${id} no fue encontrado.`);
    }

    return new Usuario(
      row.id,
      row.nombre,
      row.correo,
      row.telefono,
      row.contrasena,
      row.rol as RolUsuario,
    );
  }

  async listarUsuarios(): Promise<Omit<Usuario, 'contrasena'>[]> {
    const rows = await this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      correo: r.correo,
      telefono: r.telefono,
      rol: r.rol as RolUsuario,
    }));
  }
}
