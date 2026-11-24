import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import type {
  ApiError,
  Espacio,
  Pago,
  Reservacion,
  UsuarioPublico,
} from '../../../../core/models';
import { EspaciosAdminService } from '../../../espacios/services/espacios-admin.service';
import { PagosAdminService } from '../../../pagos/services/pagos-admin.service';
import { UsuariosAdminService } from '../../../usuarios/services/usuarios-admin.service';
import { ReservacionesAdminService } from '../../services/reservaciones-admin.service';
import { ReservacionDetailPageComponent } from './reservacion-detail-page.component';

describe('ReservacionDetailPageComponent', () => {
  const obtenerPorIdSpy = vi.fn();
  const cancelarSpy = vi.fn();
  const registrarPagoSpy = vi.fn();
  const obtenerPagoSpy = vi.fn();

  const reservacionPendiente: Reservacion = {
    id: 'res-1',
    fecha: '2026-12-01',
    horaInicio: '10:00',
    horaFin: '12:00',
    estado: 'pendiente',
    espacioId: 'esp-1',
    usuarioId: 'cli-1',
    pagoId: '',
    cantidadPersonas: 4,
    subtotal: 400,
  };

  const reservacionConfirmadaConPago: Reservacion = {
    ...reservacionPendiente,
    estado: 'confirmada',
    pagoId: 'pago-1',
  };

  const pagoCompletado: Pago = {
    id: 'pago-1',
    montoTotal: 400,
    estado: 'COMPLETADO',
    metodo: 'EFECTIVO',
  };

  const clienteMock: UsuarioPublico = {
    id: 'cli-1',
    nombre: 'Carlos Ruiz',
    correo: 'carlos@correo.com',
    telefono: '5550001122',
    rol: 'CLIENTE',
  };

  const espacioMock: Espacio = {
    id: 'esp-1',
    nombre: 'Sala Ejecutiva',
    descripcion: 'Sala con pantalla 4K.',
    tipo: 'Sala',
    costoPorHora: 200,
    activo: true,
    duracionMinutos: 60,
    sedeId: 'sede-1',
    capacidadMaxima: 8,
    amenidades: ['WiFi'],
    minimoHorasReserva: 1,
    maximoHorasReserva: 4,
  };

  beforeEach(async () => {
    obtenerPorIdSpy.mockReset();
    cancelarSpy.mockReset();
    registrarPagoSpy.mockReset();
    obtenerPagoSpy.mockReset();

    obtenerPorIdSpy.mockReturnValue(of(reservacionPendiente));
    registrarPagoSpy.mockReturnValue(
      of({ cantidad: 1, total: 400, pagos: [pagoCompletado] }),
    );
    obtenerPagoSpy.mockReturnValue(of(pagoCompletado));

    await TestBed.configureTestingModule({
      imports: [ReservacionDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'res-1' }) },
          },
        },
        {
          provide: ReservacionesAdminService,
          useValue: {
            obtenerPorId: obtenerPorIdSpy,
            confirmar: vi.fn(),
            completar: vi.fn(),
            cancelar: cancelarSpy,
          },
        },
        {
          provide: UsuariosAdminService,
          useValue: {
            obtenerPorId: () => of(clienteMock),
          },
        },
        {
          provide: EspaciosAdminService,
          useValue: {
            obtenerEspacio: () => of(espacioMock),
          },
        },
        {
          provide: PagosAdminService,
          useValue: {
            obtenerPorId: obtenerPagoSpy,
            registrarPago: registrarPagoSpy,
            completarPago: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  it('abre ConfirmModalComponent para cobrar en efectivo y recarga mostrando Pago COMPLETADO y Reservación Confirmada', () => {
    const fixture = TestBed.createComponent(ReservacionDetailPageComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    const btnCobrar = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('en efectivo'),
    );
    expect(btnCobrar).toBeTruthy();

    btnCobrar!.click();
    fixture.detectChanges();

    expect(comp.pendingAction()).toBe('cobrarEfectivo');
    expect(host.textContent).toContain('Registrar cobro en efectivo');

    obtenerPorIdSpy.mockReturnValue(of(reservacionConfirmadaConPago));

    const btnConfirmarModal = Array.from(host.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Registrar cobro',
    );
    expect(btnConfirmarModal).toBeTruthy();
    btnConfirmarModal!.click();
    fixture.detectChanges();

    expect(registrarPagoSpy).toHaveBeenCalledWith({
      reservacionIds: ['res-1'],
      metodo: 'EFECTIVO',
    });
    expect(comp.pendingAction()).toBeNull();
    expect(host.textContent).toContain('Confirmada');
    expect(host.textContent).toContain('Completado');
  });

  it('muestra DomainErrorAlertComponent cuando cancelar falla con HTTP 409', () => {
    const conflictError: ApiError = {
      statusCode: 409,
      tipoError: 'EstadoReservacionInvalidoError',
      message: 'La reservación ya no admite cancelación.',
    };
    cancelarSpy.mockReturnValue(throwError(() => conflictError));

    const fixture = TestBed.createComponent(ReservacionDetailPageComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    const btnCancelar = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Cancelar reservación'),
    );
    expect(btnCancelar).toBeTruthy();
    btnCancelar!.click();
    fixture.detectChanges();

    expect(comp.pendingAction()).toBe('cancelar');
    expect(host.textContent).toContain('¿Seguro que deseas cancelar');

    const btnConfirmarCancel = Array.from(host.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Sí, cancelar',
    );
    btnConfirmarCancel!.click();
    fixture.detectChanges();

    expect(cancelarSpy).toHaveBeenCalledWith('res-1');
    expect(comp.pendingAction()).toBeNull();
    expect(host.textContent).toContain('La reservación ya no admite cancelación.');
  });
});
