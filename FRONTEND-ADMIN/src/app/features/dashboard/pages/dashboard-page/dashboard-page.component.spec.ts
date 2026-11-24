import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { DashboardResumen } from '../../../../core/models';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  const mockResumen: DashboardResumen = {
    espacios: { total: 4, activos: 3, inactivos: 1 },
    reservaciones: {
      total: 10,
      pendientes: 2,
      confirmadas: 4,
      completadas: 3,
      canceladas: 1,
      hoy: 2,
      proximos7Dias: 5,
    },
    ingresos: {
      acumulados: 2450,
      pendientesPorCobrar: 600,
      pagosCompletados: 5,
      pagosPendientes: 2,
    },
    usuarios: { total: 12, clientes: 10, admins: 2 },
    topEspacios: [
      {
        espacioId: 'esp-1',
        nombre: 'Sala de Juntas Magna',
        tipo: 'Sala',
        totalReservaciones: 6,
        ingresosGenerados: 1800,
      },
    ],
    ultimasReservaciones: [
      {
        id: 'res-1',
        fecha: '2026-11-26',
        horaInicio: '10:00',
        horaFin: '12:00',
        estado: 'confirmada',
        subtotal: 400,
        espacio: {
          id: 'esp-1',
          nombre: 'Sala de Juntas Magna',
          tipo: 'Sala',
        },
        cliente: {
          id: 'cli-1',
          nombre: 'Ana López',
          correo: 'ana@correo.com',
        },
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: {
            obtenerResumen: () => of(mockResumen),
          },
        },
      ],
    }).compileComponents();
  });

  it('renderiza KPIs, top espacios y últimas reservaciones desde DashboardService', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('2,450.00');
    expect(text).toContain('600.00');
    expect(text).toContain('3');
    expect(text).toContain('de 4 activos');
    expect(text).toContain('12');
    expect(text).toContain('Sala de Juntas Magna');
    expect(text).toContain('Ana López');
    expect(text).toContain('ana@correo.com');
    expect(text).toContain('Confirmada');
  });
});
