import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatEventType' })
export class FormatEventTypePipe implements PipeTransform {
  /**
   * Event types arrive namespaced and snake-cased (`keyvault.hook.key_moved`).
   * Only the action matters in the UI, so drop the namespace and entity
   * segments and render the remainder as `Key Moved`.
   */
  transform(value: string): string {
    if (!value) return '—';
    const trimmed = value.trim();
    if (!trimmed) return '—';

    const segments = trimmed
      .replace(/^keyvault\./i, '')
      .split('.')
      .filter(Boolean);

    const action = segments[segments.length - 1] ?? '';
    const words = action
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .filter(Boolean);
    const capitalized = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

    return capitalized || '—';
  }
}
