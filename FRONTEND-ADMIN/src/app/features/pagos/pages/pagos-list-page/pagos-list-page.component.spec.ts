import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { PagoDetallado, ResultadoPaginado } from '../../../../core/models';
import { PagosAdminService } from '../../services/pagos-admin.service';
import { PagosListPageComponent } from './pagos-list-page.component';

describe('PagosListPageComponent', () => {
  const listarSpy = vi.fn();

  const mockRespuesta: ResultadoPaginado<PagoDetallado> = {
    items: [
      {
        id: 'pago-12345678',
        montoTotal: 400,
        estado: 'COMPLETADO',
        metodo: 'TARJETA',
        referencia: 'AUTH-CN-1001',
        reservacion: {
          id: 'res-1',
          fecha: '2026-11-30',
          horaInicio: '10:00',
          horaFin: '12:00',
          estado: 'confirmada',
          espacioId: 'esp-1',
          usuarioId: 'usr-1',
          espacioNombre: 'Sala de Juntas Magna',
          usuarioNombre: 'Cliente Portal Demo',
        },
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    listarSpy.mockReset();
    listarSpy.mockReturnValue(of(mockRespuesta));

    await TestBed.configureTestingModule({
      imports: [PagosListPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: PagosAdminService,
          useValue: {
            listar: listarSpy,
            completarPago: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  it('muestra filtros operativos de búsqueda y método, enlace a reservaciones pendientes y omite selector de estado', () => {
    const fixture = TestBed.createComponent(PagosListPageComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(host.querySelector('#pago-busqueda')).toBeTruthy();
    expect(host.querySelector('#pago-metodo')).toBeTruthy();
    expect(host.querySelector('#pago-estado')).toBeNull();
    expect(text).not.toContain('Reembolsado');

    const linkPendientes = Array.from(host.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Reservaciones pendientes'),
    );
    expect(linkPendientes).toBeTruthy();
    expect(linkPendientes!.getAttribute('href')).toContain(
      '/reservaciones?estado=pendiente',
    );
  });

  it('aplica y limpia filtros de búsqueda y método reiniciando a page 1 sin enviar estado', () => {
    const fixture = TestBed.createComponent(PagosListPageComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.page.set(2);
    comp.filterForm.setValue({
      busqueda: '  AUTH-CN  ',
      metodo: 'TARJETA',
    });

    comp.aplicarFiltros();
    fixture.detectChanges();

    expect(comp.page()).toBe(1);
    expect(listarSpy).toHaveBeenLastCalledWith({
      busqueda: 'AUTH-CN',
      metodo: 'TARJETA',
      page: 1,
      limit: 10,
    });

    comp.limpiarFiltros();
    fixture.detectChanges();

    expect(comp.hasActiveFilters()).toBe(false);
    expect(listarSpy).toHaveBeenLastCalledWith({
      busqueda: undefined,
      metodo: undefined,
      page: 1,
      limit: 10,
    });
  });
});
