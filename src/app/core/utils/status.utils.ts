/**
 * Resolves a user's display status from the API payload.
 * The API reports state as the `active` boolean: true -> Active, false -> Inactive.
 * Falls back to other payload fields only when `active` is absent.
 */
export function resolveUserStatus(user: any): 'Active' | 'Inactive' {
  if (!user) return 'Inactive';

  const active = user.active;
  if (typeof active === 'boolean') return active ? 'Active' : 'Inactive';
  if (typeof active === 'string') {
    const normalized = active.trim().toUpperCase();
    if (normalized === 'TRUE' || normalized === 'ACTIVE') return 'Active';
    if (normalized === 'FALSE' || normalized === 'INACTIVE') return 'Inactive';
  }

  if (typeof user.enabled === 'boolean') return user.enabled ? 'Active' : 'Inactive';
  if (typeof user.enabled === 'string') {
    const normalized = user.enabled.trim().toUpperCase();
    if (normalized === 'TRUE') return 'Active';
    if (normalized === 'FALSE') return 'Inactive';
  }

  const status = typeof user.status === 'string' ? user.status.trim().toUpperCase() : '';
  if (status === 'ACTIVE' || status === 'INACTIVE') {
    return status === 'ACTIVE' ? 'Active' : 'Inactive';
  }

  return 'Inactive';
}