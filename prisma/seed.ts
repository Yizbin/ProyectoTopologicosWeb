import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  process.loadEnvFile?.('.env');
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seeder de la base de datos...');

  // usuario admin
  const passwordAdmin = await bcrypt.hash('Admin123*', 10);
  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@seeder.com' },
    update: {
      nombre: 'Administrador del Sistema',
      telefono: '555-0101',
      contrasena: passwordAdmin,
      rol: 'ADMIN',
    },
    create: {
      id: 'usr-admin-seed',
      nombre: 'Administrador del Sistema',
      correo: 'admin@seeder.com',
      telefono: '555-0101',
      contrasena: passwordAdmin,
      rol: 'ADMIN',
    },
  });
  console.log(`Usuario ADMIN creado/actualizado: ${admin.correo} (pass: Admin123*)`);

  // Usuario cliente
  const passwordCliente = await bcrypt.hash('Cliente123*', 10);
  const cliente = await prisma.usuario.upsert({
    where: { correo: 'cliente@seeder.com' },
    update: {
      nombre: 'Cliente Ejemplo',
      telefono: '555-0102',
      contrasena: passwordCliente,
      rol: 'CLIENTE',
    },
    create: {
      id: 'usr-cliente-seed',
      nombre: 'Cliente Ejemplo',
      correo: 'cliente@seeder.com',
      telefono: '555-0102',
      contrasena: passwordCliente,
      rol: 'CLIENTE',
    },
  });
  console.log(`Usuario CLIENTE creado/actualizado: ${cliente.correo} (pass: Cliente123*)`);

  // Sede
  const sede = await prisma.sede.upsert({
    where: { id: 'sede-central-seed' },
    update: {
      nombre: 'Sede Central Tecnológica',
      direccion: 'Av. Universidad 1000, Edificio Innovación',
      telefonoActivo: '555-0200',
      horaAperturaGeneral: '08:00',
      horaCierreGeneral: '20:00',
    },
    create: {
      id: 'sede-central-seed',
      nombre: 'Sede Central Tecnológica',
      direccion: 'Av. Universidad 1000, Edificio Innovación',
      telefonoActivo: '555-0200',
      horaAperturaGeneral: '08:00',
      horaCierreGeneral: '20:00',
    },
  });
  console.log(`Sede creada/actualizada: ${sede.nombre}`);

  // Espacios
  const sala = await prisma.espacio.upsert({
    where: { id: 'espacio-sala-seed' },
    update: {
      nombre: 'Sala de Juntas Magna',
      descripcion: 'Sala equipada con sistema de videoconferencia, pantalla 4K y capacidad para 12 personas.',
      tipo: 'SALA',
      costoPorHora: 200,
      activo: true,
      duracionMinutos: 60,
      sedeId: sede.id,
      capacidadMaxima: 12,
      amenidades: ['Pantalla 4K', 'Pizarrón de cristal', 'WiFi 6', 'Cafetera'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    },
    create: {
      id: 'espacio-sala-seed',
      nombre: 'Sala de Juntas Magna',
      descripcion: 'Sala equipada con sistema de videoconferencia, pantalla 4K y capacidad para 12 personas.',
      tipo: 'SALA',
      costoPorHora: 200,
      activo: true,
      duracionMinutos: 60,
      sedeId: sede.id,
      capacidadMaxima: 12,
      amenidades: ['Pantalla 4K', 'Pizarrón de cristal', 'WiFi 6', 'Cafetera'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    },
  });
  console.log(`Espacio creado/actualizado: ${sala.nombre}`);

  const cubiculo = await prisma.espacio.upsert({
    where: { id: 'espacio-cubiculo-seed' },
    update: {
      nombre: 'Cubículo Individual A-1',
      descripcion: 'Espacio individual insonorizado óptimo para estudio, videollamadas o coworking.',
      tipo: 'CUBICULO',
      costoPorHora: 60,
      activo: true,
      duracionMinutos: 60,
      sedeId: sede.id,
      capacidadMaxima: 2,
      amenidades: ['Escritorio regulable', 'Silla ergonómica', 'Tomas USB/220V', 'WiFi'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 6,
    },
    create: {
      id: 'espacio-cubiculo-seed',
      nombre: 'Cubículo Individual A-1',
      descripcion: 'Espacio individual insonorizado óptimo para estudio, videollamadas o coworking.',
      tipo: 'CUBICULO',
      costoPorHora: 60,
      activo: true,
      duracionMinutos: 60,
      sedeId: sede.id,
      capacidadMaxima: 2,
      amenidades: ['Escritorio regulable', 'Silla ergonómica', 'Tomas USB/220V', 'WiFi'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 6,
    },
  });
  console.log(`Espacio creado/actualizado: ${cubiculo.nombre}`);

  // Horarios de atencion
  for (const espacioId of [sala.id, cubiculo.id]) {
    for (let dia = 1; dia <= 5; dia++) {
      const horarioId = `horario-${espacioId}-d${dia}`;
      await prisma.horarioAtencion.upsert({
        where: { id: horarioId },
        update: {
          diaSemana: dia,
          horaApertura: '08:00',
          horaCierre: '20:00',
          espacioId,
        },
        create: {
          id: horarioId,
          diaSemana: dia,
          horaApertura: '08:00',
          horaCierre: '20:00',
          espacioId,
        },
      });
    }
  }
  console.log('Horarios de atención configurados de lunes a viernes (08:00 - 20:00).');

  console.log('Seeder completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error ejecutando seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
