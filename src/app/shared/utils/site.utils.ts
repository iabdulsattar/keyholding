/**
 * Security level helpers.
 *
 * Sites and cabinets both carry a `securityLevel` enum, but they use
 * different value sets: sites are `LOW | STANDARD | HIGH | VERY_HIGH` while
 * cabinets are `LOW | MEDIUM | HIGH | TOP_SECRET`. Several screens previously
 * rendered the wrong field (a location type or a cabinet type) under the
 * "Security Level" label, so these helpers keep the mapping in one place.
 */

const SITE_SECURITY_LEVEL_LABELS: Record<string, string> = {
  LOW: 'Low',
  STANDARD: 'Standard',
  HIGH: 'High',
  VERY_HIGH: 'Very High',
};

const CABINET_SECURITY_LEVEL_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  TOP_SECRET: 'Top Secret',
};

/** Title-case each word so an unmapped enum never leaks underscores. */
function humanize(value: string): string {
  const text = (value || '').trim();
  if (!text) return '—';
  return text
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getSiteSecurityLevelLabel(value?: string | null): string {
  if (!value) return '—';
  return SITE_SECURITY_LEVEL_LABELS[value] || humanize(value);
}

export function getCabinetSecurityLevelLabel(value?: string | null): string {
  if (!value) return '—';
  return CABINET_SECURITY_LEVEL_LABELS[value] || humanize(value);
}
