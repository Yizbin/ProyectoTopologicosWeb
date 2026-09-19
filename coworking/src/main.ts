import { EspacioMemoryRepository } from './infraestructura/repositorios/espacio.memory.repository';
import { ReservacionMemoryRepository } from './infraestructura/repositorios/reservacion.memory.repository';
import { ReservacionService } from './dominio/servicios/reservacion.service';
import { Espacio, TipoEspacio } from './dominio/entidades/espacio.entity';
import { HorarioAtencion } from './dominio/entidades/horario-atencion.entity';
import { Reservacion, EstadoReservacion } from './dominio/entidades/reservacion.entity';

async function ejecutarEscenarios() {
    console.log("INICIANDO PRUEBAS DEL DOMINIO DE RESERVAS");
    console.log();

    // iniciar infra
    const espacioRepo = new EspacioMemoryRepository();
    const reservacionRepo = new ReservacionMemoryRepository();

    // añadirle las dependencias al service
    const reservacionService = new ReservacionService(reservacionRepo, espacioRepo);

    // creamos un espacio (como si fueramos el administrador)
    const idEspacio = "1";
    espacioRepo.espacios.push(
        new Espacio(idEspacio, "Sala de Juntas del 1800", "Sala con proyector", TipoEspacio.SALA, 250, true, 60)
    );
    // horario Lunes (1) de 09:00 a 18:00
    espacioRepo.horarios.push(
        new HorarioAtencion("horario-1", 1, "09:00", "18:00", idEspacio)
    );

    // Fecha para pruebas (lunes 2 de Octubre de 2023) (los getDay() van a devolver 1 osea lunes)
    const fechaLunes = new Date("2023-10-02T12:00:00Z");

    console.log("Datos base cargados: Sala de Juntas del 1800, disponible los Lunes de 09:00 a 18:00.");
    console.log();

    // caso 1: reservacion exito
    console.log("Caso 1: Creando reservacion valida (10:00 a 12:00) ------------------------------------------");
    try {
        const reservacion1 = new Reservacion(
            "res-1", fechaLunes, "10:00", "12:00", EstadoReservacion.PENDIENTE, "cliente-1", idEspacio
        );
        await reservacionService.crearReservacion(reservacion1);
        console.log("EXITO: La reservacion 1 se creo correctamente y bloqueo el horario de 10:00 a 12:00.");
    } catch (error: any) {
        console.error("ERROR:", error.message);
    }

    console.log();

    // caso 2: rechazo por la regla de empalme de horarios
    console.log("Caso 2: Intentando reservar horario empalmado (11:00 a 13:00) ------------------------------------------"); 
    try {
        const reservacion2 = new Reservacion(
            "res-2", fechaLunes, "11:00", "13:00", EstadoReservacion.PENDIENTE, "cliente-2", idEspacio
        );
        await reservacionService.crearReservacion(reservacion2);
        console.log("ERROR: La regla fallo y permitio el empalme.");
    } catch (error: any) {
        console.log(`REGLA APLICADA CORRECTAMENTE: ${error.message}`);
    }

    console.log();

    // caso 3: Rechazo por la regla de fuera de horario
    console.log("Escenario 3: Intentando reservar fuera de horario (19:00 a 20:00) ------------------------------------------"); 
    try {
        const reservacion3 = new Reservacion(
            "res-3", fechaLunes, "19:00", "20:00", EstadoReservacion.PENDIENTE, "cliente-3", idEspacio
        );
        await reservacionService.crearReservacion(reservacion3);
        console.log("ERROR: La regla fallo y permitio agendar fuera de horario.");
    } catch (error: any) {
        console.log(`REGLA APLICADA CORRECTAMENTE: ${error.message}`);
    }
}

ejecutarEscenarios();