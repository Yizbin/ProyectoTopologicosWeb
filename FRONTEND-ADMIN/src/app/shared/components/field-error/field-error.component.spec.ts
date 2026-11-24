import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { FieldErrorComponent } from './field-error.component';

describe('FieldErrorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldErrorComponent],
    }).compileComponents();
  });

  it('oculta errores si el campo no ha sido tocado ni modificado y los muestra al tocarlo', () => {
    const control = new FormControl('', [
      Validators.required,
      Validators.minLength(4),
    ]);
    const fixture = TestBed.createComponent(FieldErrorComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('fieldName', 'Nombre');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')).toBeNull();

    control.markAsTouched();
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'El campo Nombre es obligatorio.',
    );

    control.setValue('AB');
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'al menos 4 caracteres',
    );

    control.setValue('Sala Magna');
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('prioriza mensajes personalizados cuando se envían en customMessages', () => {
    const control = new FormControl('abc', [Validators.email]);
    control.markAsTouched();

    const fixture = TestBed.createComponent(FieldErrorComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('customMessages', {
      email: 'Usa un correo institucional válido.',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Usa un correo institucional válido.',
    );
  });
});
