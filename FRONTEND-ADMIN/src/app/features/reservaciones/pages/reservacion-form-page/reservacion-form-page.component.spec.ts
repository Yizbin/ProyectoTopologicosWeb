import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { of } from 'rxjs';
import type { EspacioBuscado, UsuarioPublico } from '../../../../core/models';
import { EspaciosAdminService } from '../../../espacios/services/espacios-admin.service';
import { UsuariosAdminService } from '../../../usuarios/services/usuarios-admin.service';
import { ReservacionesAdminService } from '../../services/reservaciones-admin.service';
import { ReservacionFormPageComponent } from './reservacion-form-page.component';

describe('ReservacionFormPageComponent', () => {
  const crearSpy = vi.fn();

  const mockUsuarios: UsuarioPublico[] = [
    {
      id: 'cli-1',
      nombre: 'Laura Mendoza',
      correo: 'laura@correo.com',
      telefono: '5551112233',
      rol: 'CLIENTE',
    },
  ];

  const mockEspacios: EspacioBuscado[] = [
    {
      id: 'esp-1',
      nombre: 'Sala Ejecutiva',
      descripcion: 'Sala equipada.',
      tipo: 'Sala',
      costoPorHora: 250,
      activo: true,
      duracionMinutos: 60,
      sedeId: 'sede-1',
      capacidadMaxima: 8,
      amenidades: ['WiFi'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    },
  ];

  beforeEach(async () => {
    crearSpy.mockReset();
    crearSpy.mockReturnValue(
      of({
        id: 'res-nueva',
        fecha: '2026-12-10',
        horaInicio: '10:00',
        horaFin: '12:00',
        estado: 'pendiente',
        espacioId: 'esp-1',
        usuarioId: 'cli-1',
        pagoId: '',
        cantidadPersonas: 3,
        subtotal: 500,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [ReservacionFormPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ usuarioId: 'cli-1' }),
            },
          },
        },
        {
          provide: ReservacionesAdminService,
          useValue: { crear: crearSpy },
        },
        {
          provide: UsuariosAdminService,
          useValue: { listarTodos: () => of(mockUsuarios) },
        },
        {
          provide: EspaciosAdminService,
          useValue: { listarTodosEspacios: () => of(mockEspacios) },
        },
      ],
    }).compileComponents();
  });

  it('preselecciona usuarioId por query param, valida campos y calcula subtotal estimado', () => {
    const fixture = TestBed.createComponent(ReservacionFormPageComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.form.controls.usuarioId.value).toBe('cli-1');
    expect(comp.hasUnsavedChanges()).toBe(false);

    comp.onSubmit();
    fixture.detectChanges();
    expect(comp.form.invalid).toBe(true);
    expect(crearSpy).not.toHaveBeenCalled();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('El campo espacio es obligatorio.');
    expect(text).toContain('El campo fecha es obligatorio.');

    comp.form.patchValue({
      espacioId: 'esp-1',
      fecha: '2026-12-10',
      horaInicio: '14:00',
      horaFin: '12:00',
    });
    comp.form.controls.horaFin.markAsTouched();
    fixture.detectChanges();

    expect(comp.form.controls.horaFin.errors?.['horaFinInvalida']).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'La hora de fin debe ser posterior a la hora de inicio.',
    );

    comp.form.patchValue({ horaInicio: '10:00', horaFin: '12:00' });
    fixture.detectChanges();

    expect(comp.duracionHoras()).toBe(2);
    expect(comp.subtotalEstimado()).toBe(500);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '500.00',
    );
  });

  it('marca hasUnsavedChanges() true al editar y redirige tras crear la reservación', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(ReservacionFormPageComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.form.controls.espacioId.setValue('esp-1');
    comp.form.controls.espacioId.markAsDirty();
    comp.form.controls.fecha.setValue('2026-12-10');
    comp.form.controls.cantidadPersonas.setValue(3);

    expect(comp.hasUnsavedChanges()).toBe(true);

    comp.onSubmit();
    fixture.detectChanges();

    expect(crearSpy).toHaveBeenCalledWith({
      usuarioId: 'cli-1',
      espacioId: 'esp-1',
      fecha: '2026-12-10',
      horaInicio: '10:00',
      horaFin: '12:00',
      cantidadPersonas: 3,
    });
    expect(comp.hasUnsavedChanges()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/reservaciones', 'res-nueva'], {
      replaceUrl: true,
    });
  });
});
