import { Component, computed, input, output } from '@angular/core';
import type { ApiError } from '../../../core/models';
import {
  formatDomainError,
  getDomainErrorTitle,
} from '../../utils/error-messages';

@Component({
  selector: 'app-domain-error-alert',
  standalone: true,
  templateUrl: './domain-error-alert.component.html',
})
export class DomainErrorAlertComponent {
  readonly error = input<ApiError | null>(null);
  readonly dismissible = input(false);
  readonly dismissed = output<void>();

  readonly title = computed(() => {
    const current = this.error();
    return current ? getDomainErrorTitle(current) : '';
  });

  readonly formattedMessage = computed(() => {
    const current = this.error();
    return current ? formatDomainError(current) : '';
  });
}
