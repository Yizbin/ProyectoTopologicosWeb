import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { UsuarioAutenticado } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { AdminLayoutComponent } from './admin-layout.component';

describe('AdminLayoutComponent', () => {
  const userSignal = signal<UsuarioAutenticado | null>({
    id: 'admin-1',
    nombre: 'Carlos Admin',
    correo: 'admin@seeder.com',
    rol: 'ADMIN',
  });

  const logoutSpy = vi.fn();

  beforeEach(async () => {
    logoutSpy.mockReset();
    userSignal.set({
      id: 'admin-1',
      nombre: 'Carlos Admin',
      correo: 'admin@seeder.com',
      rol: 'ADMIN',
    });

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: userSignal.asReadonly(),
            logout: logoutSpy,
          },
        },
      ],
    }).compileComponents();
  });

  it('muestra las 5 opciones del menú para rol ADMIN y las oculta si no corresponde el rol', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();

    expect(
      fixture.componentInstance.visibleNavItems().map((item) => item.route),
    ).toEqual(['/dashboard', '/espacios', '/reservaciones', '/pagos', '/usuarios']);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Carlos Admin');
    expect(el.textContent).toContain('admin@seeder.com');

    userSignal.set({
      id: 'cli-1',
      nombre: 'Cliente',
      correo: 'cli@test.com',
      rol: 'CLIENTE',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.visibleNavItems()).toEqual([]);
  });

  it('invoca authService.logout() al pulsar el botón Cerrar sesión', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
    const logoutBtn = buttons.find((b) =>
      b.textContent?.includes('Cerrar sesión'),
    );
    expect(logoutBtn).toBeDefined();
    logoutBtn?.click();

    expect(logoutSpy).toHaveBeenCalledWith('Sesión cerrada correctamente.');
  });
});
