import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatEventType' })
export class FormatEventTypePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '—';
    const trimmed = value.trim();
    if (!trimmed) return '—';
    const withoutPrefix = trimmed.replace(/^keyvault\./i, '');
    const withSpaces = withoutPrefix
      .replace(/\./g, ' ')
      .replace(/_/g, ' ');
    const words = withSpaces.split(' ').filter(Boolean);
    const capitalized = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    return capitalized || '—';
  }
}
