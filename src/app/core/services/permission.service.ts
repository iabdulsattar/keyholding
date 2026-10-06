import { Injectable, signal } from '@angular/core';

// Shape returned inside the login response `data.serviceAccess` block.
export interface ServiceAccessGrant {
  serviceCode: string;
  wildcard?: boolean;
  permissions?: string[];
  roles?: { id?: string; code?: string; name?: string }[];
  [key: string]: any;
}

const STORAGE_KEY = 'service_access_saas';
const ORG_ROLE_STORAGE_KEY = 'org_role';

/**
 * Role values the identity service uses for privileged organisation members.
 * Compared case-insensitively against the org role, the grant role names/codes
 * and the raw permission list.
 */
const ADMIN_ROLE_NAMES = new Set([
  'owner',
  'admin',
  'administrator',
  'orgadmin',
  'org_admin',
  'organisation_admin',
  'organization_admin',
  'superadmin',
  'super_admin',
]);

/** Org roles that grant organisation-administrator rights. */
const OWNER_ROLE_NAMES = new Set([
  'owner',
  'admin',
  'administrator',
  'orgadmin',
  'org_admin',
  'organisation_admin',
  'organization_admin',
  'superadmin',
  'super_admin',
]);

/** Anything else the identity service reports (`MEMBER`, `USER`, ...) is not an admin. */
const NON_ADMIN_ROLE_NAMES = new Set(['member', 'user', 'viewer', 'guest', 'staff', 'employee']);

/**
 * Explicit administrative permissions. Used as a secondary signal so an
 * administrator is still recognised when the API omits the org role, without
 * honouring blanket wildcard grants (a plain member must never qualify).
 */
const ADMIN_PERMISSIONS = new Set([
  'admin.users.manage',
  'admin.roles.manage',
]);

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly grantsSignal = signal<ServiceAccessGrant[]>([]);
  private orgRole: string | null = null;

  get grants(): ServiceAccessGrant[] {
    return this.grantsSignal();
  }

  getOrgRole(): string | null {
    return this.orgRole;
  }

  setOrgRole(role: string | null | undefined): void {
    this.orgRole = role || null;
    // Persisted so a page refresh (which restores grants without re-reading the
    // session) still knows the user's org role. Role-gated features such as
    // subscriptions/trials would otherwise fail open for every refreshed user.
    if (this.orgRole) {
      localStorage.setItem(ORG_ROLE_STORAGE_KEY, this.orgRole);
      sessionStorage.setItem(ORG_ROLE_STORAGE_KEY, this.orgRole);
    } else {
      localStorage.removeItem(ORG_ROLE_STORAGE_KEY);
      sessionStorage.removeItem(ORG_ROLE_STORAGE_KEY);
    }
  }

  private restoreOrgRole(): void {
    const stored =
      sessionStorage.getItem(ORG_ROLE_STORAGE_KEY) || localStorage.getItem(ORG_ROLE_STORAGE_KEY);
    this.orgRole = stored || null;
  }

  /**
   * True when the signed-in user is an organisation administrator. Subscription
   * and trial features are restricted to these users.
   *
   * The org role reported by the identity service wins: a `MEMBER` is never an
   * administrator, whatever permissions the service grants happen to include
   * (a member can carry an expanded or wildcard permission list without being
   * an administrator). Only when the org role is missing do the service role
   * names and then the explicit admin permissions act as a fallback, so an
   * administrator is still recognised when the API omits `organizations`.
   */
  isOrgAdmin(): boolean {
    const orgRole = (this.orgRole || '').trim().toLowerCase();

    if (orgRole) {
      if (NON_ADMIN_ROLE_NAMES.has(orgRole)) return false;
      if (OWNER_ROLE_NAMES.has(orgRole)) return true;
      // An unrecognised, non-member org role: fall through to the role names.
    }

    const roleNames = this.collectGrantRoleNames();
    if (roleNames.length > 0) {
      return roleNames.some((name) => ADMIN_ROLE_NAMES.has(name));
    }

    return this.getPermissions().some((p) => ADMIN_PERMISSIONS.has(p));
  }

  /** Every distinct role name/code the API attached to the service grants. */
  private collectGrantRoleNames(): string[] {
    const names = new Set<string>();
    for (const grant of this.grantsSignal()) {
      for (const role of grant.roles ?? []) {
        const candidate = (role?.name || role?.code || '').trim().toLowerCase();
        if (candidate) names.add(candidate);
      }
    }
    return Array.from(names);
  }

  /**
   * Persist the serviceAccess block from a successful login response.
   * Accepts either a single grant object or an array of grants (the API may
   * return `data.serviceAccess` as a single object, not an array).
   */
  setServiceAccess(grants: ServiceAccessGrant | ServiceAccessGrant[] | undefined): void {
    let next: ServiceAccessGrant[] = [];
    if (Array.isArray(grants)) {
      next = grants;
    } else if (grants && typeof grants === 'object') {
      next = [grants];
    }
    this.grantsSignal.set(next);
    console.log('[PermissionService] serviceAccess set:', next.length, 'grant(s)',
      next.flatMap((g) => g.permissions ?? []));

    const remember = localStorage.getItem('remember_device');
    const value = JSON.stringify(next);
    if (remember === 'true') {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      sessionStorage.setItem(STORAGE_KEY, value);
      // Mirror into localStorage too so a page refresh restores it from the
      // same place regardless of the remember flag at read time.
      localStorage.setItem(STORAGE_KEY, value);
    }
  }

  /** Read persisted grants (e.g. after a page refresh). */
  restore(): void {
    this.restoreOrgRole();
    const raw =
      sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.log('[PermissionService] no persisted service access found');
      this.grantsSignal.set([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const grants = Array.isArray(parsed) ? parsed : [parsed];
      // An empty array is a stale artifact (e.g. written before the
      // object-vs-array fix). Treat it as "not set" so it can't mask real
      // grants written by a later login, and clear the stale key.
      if (grants.length === 0) {
        console.log('[PermissionService] stale empty service access cleared');
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        this.grantsSignal.set([]);
        return;
      }
      this.grantsSignal.set(grants);
      console.log('[PermissionService] restored', grants.length, 'grant(s)');
    } catch {
      this.grantsSignal.set([]);
    }
  }

  clear(): void {
    this.grantsSignal.set([]);
    this.orgRole = null;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ORG_ROLE_STORAGE_KEY);
    sessionStorage.removeItem(ORG_ROLE_STORAGE_KEY);
  }

  getServiceAccess(): ServiceAccessGrant[] {
    return this.grantsSignal();
  }

  getPermissions(): string[] {
    const out = new Set<string>();
    for (const g of this.grantsSignal()) {
      for (const p of g.permissions ?? []) {
        if (p) out.add(p);
      }
    }
    return Array.from(out);
  }

  /** True when the user has at least one service grant. */
  hasAnyService(): boolean {
    return this.grantsSignal().some((g) => !!g.serviceCode);
  }

  /** True when the user may access the given service code (e.g. "edob"). */
  canAccessService(serviceCode: string): boolean {
    return this.grantsSignal().some((g) => g.serviceCode === serviceCode);
  }

  /**
   * True when the user holds the given permission. A grant with `wildcard: true`
   * grants every permission for that service, so the user passes the check for
   * any specified permission string.
   */
  hasPermission(permission: string): boolean {
    if (!permission) return false;
    if (this.orgRole === 'OWNER') return true;
    const normalized = permission.trim();
    if (this.getPermissions().includes(normalized)) return true;
    return this.grantsSignal().some((g) => g.wildcard === true);
  }

  hasAllPermissions(permissions: string[]): boolean {
    if (this.orgRole === 'OWNER') return true;
    return permissions.every((p) => this.hasPermission(p));
  }

  hasAnyPermission(permissions: string[]): boolean {
    if (this.orgRole === 'OWNER') return true;
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * True when the user holds at least one permission belonging to a module.
   *
   * The permission catalogue is served by the API, so module access is matched
   * on permission-code fragments (`'keys.'`, `'job.'`, ...) instead of an
   * exhaustive hard-coded list. Organisation administrators and wildcard grants
   * always pass; anyone without a matching permission loses the module's pages,
   * navigation and actions.
   */
  hasModuleAccess(...fragments: string[]): boolean {
    const needles = fragments
      .map((f) => (f || '').trim().toLowerCase())
      .filter(Boolean);
    if (needles.length === 0) return true;
    if (this.isOrgAdmin()) return true;
    if (this.grantsSignal().some((g) => g.wildcard === true)) return true;
    const codes = this.getPermissions().map((p) => p.trim().toLowerCase());
    return needles.some((needle) => codes.some((code) => code.includes(needle)));
  }
}
