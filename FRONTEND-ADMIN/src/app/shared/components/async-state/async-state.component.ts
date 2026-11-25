import { Component, input, output } from '@angular/core';
import type { ApiError } from '../../../core/models';
import { DomainErrorAlertComponent } from '../domain-error-alert/domain-error-alert.component';
import { NotFoundComponent } from '../not-found/not-found.component';

@Component({
  selector: 'app-async-state',
  standalone: true,
  imports: [DomainErrorAlertComponent, NotFoundComponent],
  templateUrl: './async-state.component.html',
})
export class AsyncStateComponent {
  readonly isLoading = input(false);
  readonly error = input<ApiError | null>(null);
  readonly isEmpty = input(false);
  readonly backLink = input('/dashboard');
  readonly backLabel = input('Volver al tablero');
  readonly loadingMessage = input('Cargando información…');
  readonly emptyTitle = input('Sin registros para mostrar');
  readonly emptyMessage = input(
    'No encontramos datos que coincidan con los criterios actuales.',
  );

  readonly retry = output<void>();
}
