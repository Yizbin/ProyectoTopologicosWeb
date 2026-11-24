import { Component, computed, input, output } from '@angular/core';

export type ConfirmModalVariant = 'danger' | 'warning' | 'primary';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class ConfirmModalComponent {
  readonly isOpen = input(false);
  readonly title = input('Confirmar acción');
  readonly message = input('');
  readonly detail = input<string | null>(null);
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly variant = input<ConfirmModalVariant>('danger');
  readonly isLoading = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly iconWrapperClasses = computed(() => {
    switch (this.variant()) {
      case 'warning':
        return 'bg-amber-100 text-amber-700';
      case 'primary':
        return 'bg-[#e4e9e0] text-[#23312b]';
      case 'danger':
      default:
        return 'bg-red-100 text-red-700';
    }
  });

  readonly confirmButtonClasses = computed(() => {
    switch (this.variant()) {
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600';
      case 'primary':
        return 'bg-[#23312b] hover:bg-[#354b42] focus-visible:outline-[#23312b]';
      case 'danger':
      default:
        return 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600';
    }
  });

  onEscape(): void {
    if (this.isOpen() && !this.isLoading()) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(): void {
    if (!this.isLoading()) {
      this.cancelled.emit();
    }
  }

  onConfirm(): void {
    if (!this.isLoading()) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.isLoading()) {
      this.cancelled.emit();
    }
  }
}
