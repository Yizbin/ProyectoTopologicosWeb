import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AsyncStateComponent } from './async-state.component';

describe('AsyncStateComponent: recurso inexistente', () => {
  it('muestra la vista 404 con salida al listado, sin sugerir reintentar', async () => {
    TestBed.configureTestingModule({ imports: [AsyncStateComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AsyncStateComponent);
    fixture.componentRef.setInput('error', { statusCode: 404, message: 'No existe', tipoError: 'NotFoundException' });
    fixture.componentRef.setInput('backLink', '/espacios');
    fixture.componentRef.setInput('backLabel', 'Volver al listado');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('404');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/espacios');
    expect(element.textContent).not.toContain('Reintentar');
  });
});
