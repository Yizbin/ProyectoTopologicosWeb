import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  readonly page = input(1);
  readonly totalPages = input(1);
  readonly total = input(0);
  readonly limit = input(20);

  readonly pageChange = output<number>();

  readonly safeTotalPages = computed(() => Math.max(1, this.totalPages()));

  readonly rangeSummary = computed(() => {
    const totalCount = this.total();
    if (totalCount === 0) {
      return 'Mostrando 0 de 0 registros';
    }
    const start = (this.page() - 1) * this.limit() + 1;
    const end = Math.min(this.page() * this.limit(), totalCount);
    return `Mostrando ${start}–${end} de ${totalCount} registros`;
  });

  readonly visiblePages = computed<number[]>(() => {
    const totalP = this.safeTotalPages();
    const current = Math.min(Math.max(1, this.page()), totalP);
    const maxButtons = 5;

    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    const end = Math.min(totalP, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  });

  goToPage(target: number): void {
    const safeTarget = Math.min(Math.max(1, target), this.safeTotalPages());
    if (safeTarget !== this.page()) {
      this.pageChange.emit(safeTarget);
    }
  }
}
