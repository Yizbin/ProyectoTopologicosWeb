import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import type { ApiError, EspacioBuscado } from '../../../../core/models';
import { EspaciosAdminService } from '../../services/espacios-admin.service';
import { EspaciosListPageComponent } from './espacios-list-page.component';

describe('EspaciosListPageComponent', () => {
  const sampleSpace: EspacioBuscado = {
    id: 'esp-1',
    nombre: 'Sala Magna',
    descripcion: 'Sala equipada para 12 personas.',
    tipo: 'Sala',
    costoPorHora: 200,
    activo: true,
    duracionMinutos: 60,
    sedeId: 'sede-1',
    capacidadMaxima: 12,
    amenidades: ['WiFi 6'],
    minimoHorasReserva: 1,
    maximoHorasReserva: 4,
  };

  const actualizarEspacioSpy = vi.fn();

  beforeEach(async () => {
    actualizarEspacioSpy.mockReset();

    await TestBed.configureTestingModule({
      imports: [EspaciosListPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: EspaciosAdminService,
          useValue: {
            listarSedes: () =>
              of([
                {
                  id: 'sede-1',
                  nombre: 'Sede Central',
                  direccion: 'Av. 1',
                  telefonoActivo: '555-0100',
                  horaAperturaGeneral: '08:00',
                  horaCierreGeneral: '20:00',
                },
              ]),
            listarEspacios: () =>
              of({
                items: [sampleSpace],
                total: 1,
                page: 1,
                limit: 8,
                totalPages: 1,
              }),
            actualizarEspacio: actualizarEspacioSpy,
          },
        },
      ],
    }).compileComponents();
  });

  it('abre ConfirmModalComponent antes de desactivar y muestra DomainErrorAlertComponent ante HTTP 409', () => {
    const http409: ApiError = {
      statusCode: 409,
      tipoError: 'EstadoReservacionInvalidoError',
      message: 'No se puede desactivar mientras existan conflictos activos.',
    };
    actualizarEspacioSpy.mockReturnValue(throwError(() => http409));

    const fixture = TestBed.createComponent(EspaciosListPageComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const desactivarBtn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Desactivar'),
    );
    expect(desactivarBtn).toBeDefined();
    expect(actualizarEspacioSpy).not.toHaveBeenCalled();

    desactivarBtn?.click();
    fixture.detectChanges();

    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Desactivar espacio');

    const confirmBtn = Array.from(dialog?.querySelectorAll('button') ?? []).find(
      (b) => b.textContent?.includes('Sí, desactivar'),
    );
    confirmBtn?.click();
    fixture.detectChanges();

    expect(actualizarEspacioSpy).toHaveBeenCalledWith('esp-1', {
      activo: false,
    });
    const alert = el.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('EstadoReservacionInvalidoError');
  });
});
