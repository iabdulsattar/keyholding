import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface EntryMetric {
  label: string;
  value: string;
  note: string;
  tone: string;
  icon: string;
}

@Component({
  selector: 'app-entries-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entries-metrics.component.html',
})
export class EntriesMetricsComponent {
  @Input() metrics: EntryMetric[] = [];

  constructor(private sanitizer: DomSanitizer) {}

  iconSvg(icon: string): SafeHtml {
    const wrap = (inner: string) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

    const trimmed = icon.trim();
    const html = trimmed.startsWith('<') && trimmed.endsWith('>')
      ? wrap(trimmed)
      : wrap(`<path d="${trimmed}"/>`);

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
