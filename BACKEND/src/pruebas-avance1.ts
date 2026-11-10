import 'reflect-metadata'; 
import { EspacioMemoryRepository } from '@/espacios/infraestructura/espacio.memory.repository';
import { ReservacionMemoryRepository } from '@/reservaciones/infraestructura/reservacion.memory.repository';
import { ReservacionesService } from '@/reservaciones/reservaciones.service';
import { Espacio, TipoEspacio } from '@/dominio/entidades/espacio.entity';
import { HorarioAtencion } from '@/dominio/entidades/horario-atencion.entity';
import { Reservacion, EstadoReservacion } from '@/dominio/entidades/reservacion.entity';
import { Sede } from '@/dominio/entidades/sede.entity';
import { Bloqueo } from '@/dominio/entidades/bloqueo.entity';
import { diaSemana, hoy, sumarDias } from '@/common/utils/fecha.util';

async function ejecutarEscenarios() {
    console.log("=== INICIANDO PRUEBAS AVANZADAS DEL DOMINIO ===\n");

    const espacioRepo = new EspacioMemoryRepository();
    const reservacionRepo = new ReservacionMemoryRepository();
    const reservacionService = new ReservacionesService(reservacionRepo, espacioRepo);

    const idSede = "sede-1";
    espacioRepo.sedes.push(new Sede(idSede, "Campus Central", "Calle 1", "555-000", "08:00", "20:00"));

    const idEspacio = "espacio-1";
    espacioRepo.espacios.push(
        new Espacio(idEspacio, "Sala 1800", "Sala con proyector", TipoEspacio.SALA, 250, true, 
            60, idSede, 10, ["Proyector"], 1, 4)
    );
    
    espacioRepo.horarios.push(new HorarioAtencion("horario-1", 1, "09:00", "18:00", idEspacio));

    let proximoLunes = sumarDias(hoy(), 7);
    while (diaSemana(proximoLunes) !== 1) proximoLunes = sumarDias(proximoLunes, 1);
    const miercoles = sumarDias(proximoLunes, 2);
    espacioRepo.horarios.push(new HorarioAtencion("horario-2", 2, "09:00", "18:00", idEspacio)); 
    espacioRepo.bloqueos.push(new Bloqueo("bloqueo-1", proximoLunes, miercoles, "00:00", "23:59", "Mantenimiento general", idEspacio, true));

    console.log("Datos: Sede (08-20h) -> Sala 1800 (Bloques 60m, Max 10p, 1-4 hrs). BLOQUEADA próximo Lun-Mie.\n");

    try {
        const fechaPasada = new Date("2022-01-01T12:00:00Z");
        const res1 = new Reservacion("res-1", fechaPasada, "10:00", "12:00", EstadoReservacion.PENDIENTE, idEspacio, "u1", "p1", 5, 0);
        await reservacionService.crearReservacion(res1);
    } catch (e: any) { console.log(`REGLA FECHA PASADA: ${e.message}`); }

    try {
        const res2 = new Reservacion("res-2", proximoLunes, "12:00", "10:00", EstadoReservacion.PENDIENTE, idEspacio, "u2", "p2", 5, 0);
        await reservacionService.crearReservacion(res2);
    } catch (e: any) { console.log(`REGLA HORA LÓGICA: ${e.message}`); }

    try {
        const martes = sumarDias(proximoLunes, 1);
        const res3 = new Reservacion("res-3", martes, "10:00", "12:00", EstadoReservacion.PENDIENTE, idEspacio, "u3", "p3", 5, 0);
        await reservacionService.crearReservacion(res3);
    } catch (e: any) { console.log(`REGLA RANGO BLOQUEO: ${e.message}`); }

    try {
        const jueves = sumarDias(proximoLunes, 3);
        espacioRepo.horarios.push(new HorarioAtencion("horario-3", diaSemana(jueves), "09:00", "18:00", idEspacio));

        const res4 = new Reservacion("res-4", jueves, "10:00", "12:00", EstadoReservacion.PENDIENTE, idEspacio, "u4", "p4", 5, 0);
        await reservacionService.crearReservacion(res4);
        console.log(`\nÉXITO: Reserva del jueves creada. Subtotal calculado: $${res4.subtotal}`);
    } catch (e: any) { console.error("Error inesperado:", e.message); }
}

ejecutarEscenarios();