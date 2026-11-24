import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { EspaciosAdminService } from '../../services/espacios-admin.service';
import { EspacioFormPageComponent } from './espacio-form-page.component';

describe('EspacioFormPageComponent', () => {
  const crearEspacioSpy = vi.fn();

  beforeEach(async () => {
    crearEspacioSpy.mockReset();
    crearEspacioSpy.mockReturnValue(
      of({
        id: 'esp-nuevo',
        nombre: 'Sala Ejecutiva',
        descripcion: 'Sala equipada con pantalla 4K.',
        tipo: 'Sala',
        costoPorHora: 250,
        activo: true,
        duracionMinutos: 60,
        sedeId: 'sede-1',
        capacidadMaxima: 8,
        amenidades: ['WiFi 6'],
        minimoHorasReserva: 1,
        maximoHorasReserva: 4,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [EspacioFormPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) },
          },
        },
        {
          provide: EspaciosAdminService,
          useValue: {
            listarSedes: () =>
              of([
                {
                  id: 'sede-1',
                  nombre: 'Sede Central',
                  direccion: 'Av. Universidad 1000',
                  telefonoActivo: '555-0200',
                  horaAperturaGeneral: '08:00',
                  horaCierreGeneral: '20:00',
                },
              ]),
            crearEspacio: crearEspacioSpy,
          },
        },
      ],
    }).compileComponents();
  });

  it('valida campos obligatorios y el validador cruzado maximoHorasReserva >= minimoHorasReserva', () => {
    const fixture = TestBed.createComponent(EspacioFormPageComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.hasUnsavedChanges()).toBe(false);

    comp.onSubmit();
    fixture.detectChanges();
    expect(comp.form.invalid).toBe(true);
    expect(crearEspacioSpy).not.toHaveBeenCalled();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('El campo nombre es obligatorio.');
    expect(text).toContain('El campo descripción es obligatorio.');

    comp.form.patchValue({
      nombre: 'Sala Ejecutiva',
      descripcion: 'Descripción válida de al menos diez caracteres.',
      tipo: 'Sala',
      sedeId: 'sede-1',
      costoPorHora: 200,
      capacidadMaxima: 8,
      duracionMinutos: 60,
      minimoHorasReserva: 5,
      maximoHorasReserva: 2,
    });
    comp.form.controls.maximoHorasReserva.markAsTouched();
    fixture.detectChanges();

    expect(comp.form.controls.maximoHorasReserva.errors?.['rangoHorasInvalido']).toBe(
      true,
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'El máximo de horas debe ser mayor o igual al mínimo.',
    );
  });

  it('marca hasUnsavedChanges() true al editar y false tras guardar con éxito', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(EspacioFormPageComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.form.controls.nombre.setValue('Sala Ejecutiva');
    comp.form.controls.nombre.markAsDirty();
    comp.form.controls.descripcion.setValue(
      'Descripción completa para la sala ejecutiva.',
    );
    comp.form.controls.sedeId.setValue('sede-1');

    expect(comp.hasUnsavedChanges()).toBe(true);

    comp.onSubmit();
    fixture.detectChanges();

    expect(crearEspacioSpy).toHaveBeenCalledOnce();
    expect(comp.hasUnsavedChanges()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/espacios', 'esp-nuevo'], {
      replaceUrl: true,
    });
  });
});
