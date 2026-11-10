import '../src/config/load-env.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcrypt';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function proximoDiaHabil(diasBase: number): Date {
  const ahora = new Date();
  const fecha = new Date(
    Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + diasBase),
  );
  while (fecha.getUTCDay() === 0 || fecha.getUTCDay() === 6) {
    fecha.setUTCDate(fecha.getUTCDate() + 1);
  }
  return fecha;
}

function diaHabilPasado(diasAtras = 3): Date {
  const ahora = new Date();
  const fecha = new Date(
    Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasAtras),
  );
  while (fecha.getUTCDay() === 0 || fecha.getUTCDay() === 6) {
    fecha.setUTCDate(fecha.getUTCDate() - 1);
  }
  return fecha;
}

async function main() {
  console.log('Iniciando seeder de la base de datos...');

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
  console.log(`Usuario ADMIN listo: ${admin.correo} (pass: Admin123*)`);

  const passwordCliente = await bcrypt.hash('Cliente123*', 10);
  const clienteLocal = await prisma.usuario.upsert({
    where: { correo: 'cliente@sistema.local' },
    update: {
      nombre: 'Cliente Portal Demo',
      telefono: '555-0100',
      contrasena: passwordCliente,
      rol: 'CLIENTE',
    },
    create: {
      id: 'usr-cliente-local-seed',
      nombre: 'Cliente Portal Demo',
      correo: 'cliente@sistema.local',
      telefono: '555-0100',
      contrasena: passwordCliente,
      rol: 'CLIENTE',
    },
  });
  console.log(`Usuario CLIENTE listo: ${clienteLocal.correo} (pass: Cliente123*)`);

  const clienteSeeder = await prisma.usuario.upsert({
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
  console.log(`Usuario CLIENTE secundario listo: ${clienteSeeder.correo} (pass: Cliente123*)`);

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
  console.log(`Sede lista: ${sede.nombre}`);

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

  const pcStation = await prisma.espacio.upsert({
    where: { id: 'espacio-pc-seed' },
    update: {
      nombre: 'Estación Pro Work & Render PC-04',
      descripcion: 'Estación de cómputo de alto rendimiento con monitor ultrawide, GPU dedicada y fibra simétrica.',
      tipo: 'PC',
      costoPorHora: 45,
      activo: true,
      duracionMinutos: 60,
      sedeId: sede.id,
      capacidadMaxima: 1,
      amenidades: ['Monitor 34" 144Hz', '32 GB RAM', 'GPU RTX', 'Ethernet 1 Gbps'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 8,
    },
    create: {
      id: 'espacio-pc-seed',
      nombre: 'Estación Pro Work & Render PC-04',
      descripcion: 'Estación de cómputo de alto rendimiento con monitor ultrawide, GPU dedicada y fibra simétrica.',
      tipo: 'PC',
      costoPorHora: 45,
      activo: true,
      duracionMinutos: 60,
      sedeId: sede.id,
      capacidadMaxima: 1,
      amenidades: ['Monitor 34" 144Hz', '32 GB RAM', 'GPU RTX', 'Ethernet 1 Gbps'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 8,
    },
  });

  const salaSinHorarios = await prisma.espacio.upsert({
    where: { id: 'espacio-sin-horarios-seed' },
    update: {
      nombre: 'Sala Acústica B-2 (Próxima Apertura)',
      descripcion: 'Sala preparada para grabaciones y sesiones privadas; actualmente en asignación de turnos.',
      tipo: 'SALA',
      costoPorHora: 150,
      activo: true,
      duracionMinutos: 60,
      sedeId: sede.id,
      capacidadMaxima: 6,
      amenidades: ['Paneles acústicos', 'Iluminación cálida', 'WiFi 6'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    },
    create: {
      id: 'espacio-sin-horarios-seed',
      nombre: 'Sala Acústica B-2 (Próxima Apertura)',
      descripcion: 'Sala preparada para grabaciones y sesiones privadas; actualmente en asignación de turnos.',
      tipo: 'SALA',
      costoPorHora: 150,
      activo: true,
      duracionMinutos: 60,
      sedeId: sede.id,
      capacidadMaxima: 6,
      amenidades: ['Paneles acústicos', 'Iluminación cálida', 'WiFi 6'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    },
  });

  await prisma.horarioAtencion.deleteMany({
    where: { espacioId: salaSinHorarios.id },
  });

  for (const espacioId of [sala.id, cubiculo.id, pcStation.id]) {
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
  console.log(
    `Espacios listos: 3 con horarios L-V (08:00-20:00) + 1 activo sin horarios (${salaSinHorarios.id}).`,
  );

  const fechaFuturaMas3 = proximoDiaHabil(3);
  const fechaFuturaMas4 = proximoDiaHabil(4);
  const fechaPasada = diaHabilPasado(3);

  const isoMas3 = fechaFuturaMas3.toISOString().slice(0, 10);
  const isoMas4 = fechaFuturaMas4.toISOString().slice(0, 10);

  const reservacionesDummy = [
    {
      id: 'res-local-confirmada',
      fecha: fechaFuturaMas3,
      horaInicio: '10:00',
      horaFin: '12:00',
      estado: 'CONFIRMADA' as const,
      espacioId: sala.id,
      usuarioId: clienteLocal.id,
      cantidadPersonas: 6,
      subtotal: 400,
    },
    {
      id: 'res-local-pendiente',
      fecha: fechaFuturaMas4,
      horaInicio: '14:00',
      horaFin: '16:00',
      estado: 'PENDIENTE' as const,
      espacioId: cubiculo.id,
      usuarioId: clienteLocal.id,
      cantidadPersonas: 1,
      subtotal: 120,
    },
    {
      id: 'res-local-cancelada',
      fecha: fechaFuturaMas4,
      horaInicio: '09:00',
      horaFin: '10:00',
      estado: 'CANCELADA' as const,
      espacioId: cubiculo.id,
      usuarioId: clienteLocal.id,
      cantidadPersonas: 1,
      subtotal: 60,
    },
    {
      id: 'res-local-completada',
      fecha: fechaPasada,
      horaInicio: '11:00',
      horaFin: '13:00',
      estado: 'COMPLETADA' as const,
      espacioId: pcStation.id,
      usuarioId: clienteLocal.id,
      cantidadPersonas: 1,
      subtotal: 90,
    },
    {
      id: 'res-seed-confirmada',
      fecha: fechaFuturaMas3,
      horaInicio: '15:00',
      horaFin: '17:00',
      estado: 'CONFIRMADA' as const,
      espacioId: sala.id,
      usuarioId: clienteSeeder.id,
      cantidadPersonas: 4,
      subtotal: 400,
    },
    {
      id: 'res-seed-pendiente',
      fecha: fechaFuturaMas4,
      horaInicio: '12:00',
      horaFin: '14:00',
      estado: 'PENDIENTE' as const,
      espacioId: pcStation.id,
      usuarioId: clienteSeeder.id,
      cantidadPersonas: 1,
      subtotal: 90,
    },
  ];

  for (const res of reservacionesDummy) {
    await prisma.reservacion.upsert({
      where: { id: res.id },
      update: res,
      create: res,
    });
  }
  console.log(
    `Reservaciones creadas/actualizadas para ${clienteLocal.correo} (CONFIRMADA en ${isoMas3} 10:00-12:00) y ${clienteSeeder.correo}.`,
  );

  await prisma.bloqueo.upsert({
    where: { id: 'bloqueo-seed-1' },
    update: {
      fechaInicio: fechaFuturaMas3,
      fechaFin: fechaFuturaMas3,
      horaInicio: '13:00',
      horaFin: '14:00',
      motivo: 'Mantenimiento preventivo de equipo audiovisual',
      espacioId: sala.id,
      activo: true,
    },
    create: {
      id: 'bloqueo-seed-1',
      fechaInicio: fechaFuturaMas3,
      fechaFin: fechaFuturaMas3,
      horaInicio: '13:00',
      horaFin: '14:00',
      motivo: 'Mantenimiento preventivo de equipo audiovisual',
      espacioId: sala.id,
      activo: true,
    },
  });
  console.log(`Bloqueo futuro configurado en ${sala.nombre}: ${isoMas3} de 13:00 a 14:00.`);
  console.log(`Fechas listas para evidencias -> Futuro cercano: ${isoMas3}, Futuro alternativo: ${isoMas4}`);
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
