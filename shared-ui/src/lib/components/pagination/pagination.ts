import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'aura-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})

export class Pagination {
  currentPage = input.required<number>();
  totalPages = input.required<number>();

  PageChange = output<number>();

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // Mostramos maximo 5 botones de pagina a la vez
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if(current <= 2) {
      end = Math.min(total, 5);
    }
    if(current >= total -1) {
      start = Math.max(1, total - 4);
    }

    for(let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  goToPage(page: number) {
    if (page !== this.currentPage() && page >= 1 && page <= this.totalPages()) {
      this.PageChange.emit(page);
    }
  }
}
