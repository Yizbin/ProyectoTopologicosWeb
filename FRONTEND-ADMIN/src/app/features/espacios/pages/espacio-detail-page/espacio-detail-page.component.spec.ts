import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { EspacioDetailPageComponent } from './espacio-detail-page.component';
import { EspaciosAdminService } from '../../services/espacios-admin.service';
import { AuthService } from '../../../../core/services/auth.service';

describe('Cambios pendientes en horarios y bloqueos', () => {
  it('detecta ambos formularios y limpia solo los horarios después de guardarlos', () => {
    TestBed.configureTestingModule({ imports: [EspacioDetailPageComponent], providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: {} },
      { provide: AuthService, useValue: { isAuthenticated: () => true } },
      { provide: EspaciosAdminService, useValue: { guardarHorarios: () => of([]) } },
    ] });
    const component = TestBed.createComponent(EspacioDetailPageComponent).componentInstance;
    expect(component.hasUnsavedChanges()).toBe(false);
    component.horariosForm.markAsDirty();
    component.bloqueoForm.markAsDirty();
    expect(component.hasUnsavedChanges()).toBe(true);
    component.guardarHorarios();
    expect(component.horariosForm.pristine).toBe(true);
    expect(component.hasUnsavedChanges()).toBe(true);
    component.bloqueoForm.markAsPristine();
    expect(component.hasUnsavedChanges()).toBe(false);
  });
});
