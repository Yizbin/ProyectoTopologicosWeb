import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type {
  EspacioBuscado,
  Reservacion,
  UsuarioPublico,
} from '../../../../core/models';
import { EspaciosAdminService } from '../../../espacios/services/espacios-admin.service';
import { ReservacionesAdminService } from '../../../reservaciones/services/reservaciones-admin.service';
import { UsuariosAdminService } from '../../services/usuarios-admin.service';
import { UsuarioDetailPageComponent } from './usuario-detail-page.component';

describe('UsuarioDetailPageComponent', () => {
  const cambiarEstadoSpy = vi.fn();
  const mockUsuario: UsuarioPublico = {
    id: 'usr-1',
    nombre: 'Laura Mendoza',
    correo: 'laura@correo.com',
    telefono: '5551234567',
    rol: 'CLIENTE',
    activo: true,
  };

  const mockEspacios: EspacioBuscado[] = [
    {
      id: 'esp-1',
      nombre: 'Sala Norte',
      descripcion: 'Sala amplia.',
      tipo: 'Sala',
      costoPorHora: 350,
      activo: true,
      duracionMinutos: 60,
      sedeId: 'sede-1',
      capacidadMaxima: 10,
      amenidades: ['WiFi'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    },
  ];

  const mockReservaciones: Reservacion[] = [
    {
      id: 'res-a',
      fecha: '2026-11-28',
      horaInicio: '09:00',
      horaFin: '11:00',
      estado: 'confirmada',
      espacioId: 'esp-1',
      usuarioId: 'usr-1',
      pagoId: 'pago-a',
      cantidadPersonas: 5,
      subtotal: 700,
    },
    {
      id: 'res-b',
      fecha: '2026-11-20',
      horaInicio: '14:00',
      horaFin: '15:00',
      estado: 'cancelada',
      espacioId: 'esp-1',
      usuarioId: 'usr-1',
      pagoId: '',
      cantidadPersonas: 2,
      subtotal: 350,
    },
  ];

  beforeEach(async () => {
    cambiarEstadoSpy.mockReset();
    cambiarEstadoSpy.mockReturnValue(of({ ...mockUsuario, activo: false }));

    await TestBed.configureTestingModule({
      imports: [UsuarioDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'usr-1' }) },
          },
        },
        {
          provide: UsuariosAdminService,
          useValue: {
            obtenerPorId: () => of(mockUsuario),
            cambiarEstado: cambiarEstadoSpy,
          },
        },
        {
          provide: ReservacionesAdminService,
          useValue: {
            listarPorCliente: () => of(mockReservaciones),
          },
        },
        {
          provide: EspaciosAdminService,
          useValue: {
            listarTodosEspacios: () => of(mockEspacios),
          },
        },
      ],
    }).compileComponents();
  });

  it('renderiza perfil, métricas, historial de reservaciones y acceso directo para crear reservación', () => {
    const fixture = TestBed.createComponent(UsuarioDetailPageComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(text).toContain('Laura Mendoza');
    expect(text).toContain('laura@correo.com');
    expect(text).toContain('5551234567');
    expect(text).toContain('CLIENTE');
    expect(text).toContain('Historial de reservaciones (2)');
    expect(text).toContain('Sala Norte');
    expect(text).toContain('700.00');
    expect(text).toContain('Confirmada');
    expect(text).toContain('Cancelada');

    const crearLink = Array.from(host.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Crear reservación para este cliente'),
    );
    expect(crearLink).toBeTruthy();
    expect(crearLink!.getAttribute('href')).toContain(
      '/reservaciones/nueva?usuarioId=usr-1',
    );
  });

  it('abre ConfirmModalComponent para desactivar usuario y actualiza el estado en pantalla', () => {
    const fixture = TestBed.createComponent(UsuarioDetailPageComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    const btnDesactivar = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Desactivar cuenta'),
    );
    expect(btnDesactivar).toBeTruthy();

    btnDesactivar!.click();
    fixture.detectChanges();

    expect(comp.confirmandoEstado()).toBe(true);
    expect(host.textContent).toContain('Sí, desactivar');

    const btnConfirmar = Array.from(host.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Sí, desactivar',
    );
    btnConfirmar!.click();
    fixture.detectChanges();

    expect(cambiarEstadoSpy).toHaveBeenCalledWith('usr-1', false);
    expect(comp.estaActivo()).toBe(false);
    expect(host.textContent).toContain('Inactivo');
  });
});
