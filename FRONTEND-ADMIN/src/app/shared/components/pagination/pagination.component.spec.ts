import { TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();
  });

  it('muestra el rango de registros y deshabilita Anterior en la página 1', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentRef.setInput('total', 24);
    fixture.componentRef.setInput('limit', 10);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Mostrando 1–10 de 24 registros');

    const buttons = Array.from(el.querySelectorAll('button'));
    const prevBtn = buttons.find((b) => b.textContent?.includes('Anterior'));
    const nextBtn = buttons.find((b) => b.textContent?.includes('Siguiente'));

    expect(prevBtn?.disabled).toBe(true);
    expect(nextBtn?.disabled).toBe(false);
  });

  it('emite pageChange al navegar y deshabilita Siguiente en la última página', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentRef.setInput('total', 24);
    fixture.componentRef.setInput('limit', 10);
    fixture.detectChanges();

    const pageChangeSpy = vi.fn();
    fixture.componentInstance.pageChange.subscribe(pageChangeSpy);

    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    buttons.find((b) => b.textContent?.includes('Siguiente'))?.click();
    expect(pageChangeSpy).toHaveBeenCalledWith(3);

    fixture.componentRef.setInput('page', 3);
    fixture.detectChanges();
    expect(el.textContent).toContain('Mostrando 21–24 de 24 registros');

    const updatedNext = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Siguiente'),
    );
    expect(updatedNext?.disabled).toBe(true);
  });
});
