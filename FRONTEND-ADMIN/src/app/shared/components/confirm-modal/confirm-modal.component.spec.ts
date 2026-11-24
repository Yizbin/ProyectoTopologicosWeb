import { TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
    }).compileComponents();
  });

  it('no renderiza contenido cuando isOpen es false y muestra título/mensaje cuando es true', () => {
    const fixture = TestBed.createComponent(ConfirmModalComponent);
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('title', 'Desactivar espacio');
    fixture.componentRef.setInput('message', '¿Deseas desactivar esta sala?');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="dialog"]')).toBeNull();

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Desactivar espacio');
    expect(dialog?.textContent).toContain('¿Deseas desactivar esta sala?');
  });

  it('emite confirmed y cancelled al hacer clic cuando isLoading es false', () => {
    const fixture = TestBed.createComponent(ConfirmModalComponent);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('confirmLabel', 'Sí, desactivar');
    fixture.componentRef.setInput('cancelLabel', 'Volver');
    fixture.detectChanges();

    const confirmedSpy = vi.fn();
    const cancelledSpy = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmedSpy);
    fixture.componentInstance.cancelled.subscribe(cancelledSpy);

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
    buttons.find((b) => b.textContent?.includes('Sí, desactivar'))?.click();
    buttons.find((b) => b.textContent?.includes('Volver'))?.click();

    expect(confirmedSpy).toHaveBeenCalledOnce();
    expect(cancelledSpy).toHaveBeenCalledOnce();
  });

  it('bloquea botones y cierre con Escape mientras isLoading es true', () => {
    const fixture = TestBed.createComponent(ConfirmModalComponent);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const confirmedSpy = vi.fn();
    const cancelledSpy = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmedSpy);
    fixture.componentInstance.cancelled.subscribe(cancelledSpy);

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
    expect(buttons.every((b) => b.disabled)).toBe(true);

    fixture.componentInstance.onEscape();
    fixture.componentInstance.onConfirm();
    expect(confirmedSpy).not.toHaveBeenCalled();
    expect(cancelledSpy).not.toHaveBeenCalled();
  });
});
