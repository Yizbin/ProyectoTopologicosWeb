import { Component, input, output } from '@angular/core';
import type { ApiError } from '../../../core/models';
import { DomainErrorAlertComponent } from '../domain-error-alert/domain-error-alert.component';

@Component({
  selector: 'app-async-state',
  standalone: true,
  imports: [DomainErrorAlertComponent],
  templateUrl: './async-state.component.html',
})
export class AsyncStateComponent {
  readonly isLoading = input(false);
  readonly error = input<ApiError | null>(null);
  readonly isEmpty = input(false);
  readonly loadingMessage = input('Cargando información…');
  readonly emptyTitle = input('Sin registros para mostrar');
  readonly emptyMessage = input(
    'No encontramos datos que coincidan con los criterios actuales.',
  );

  readonly retry = output<void>();
}
