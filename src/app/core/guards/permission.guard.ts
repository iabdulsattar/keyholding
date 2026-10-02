import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from '../services/permission.service';

/**
 * Guard that requires the user to hold at least one of the given permissions
 * (a wildcard grant also satisfies it). Redirects to the dashboard otherwise.
 *
 * Usage:
 *   canActivate: [authGuard, permissionGuard('admin.users.manage', 'admin.roles.manage')]
 */
export function permissionGuard(...permissions: string[]): CanActivateFn {
  return (): boolean | UrlTree => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    if (permissions.length === 0) return true;

    const allowed = permissionService.hasAnyPermission(permissions);
    return allowed ? true : router.createUrlTree(['/dashboard']);
  };
}

/**
 * Guard for module pages whose permissions come from the API catalogue.
 * Access is granted when the user holds any permission matching one of the
 * given code fragments; administrators and wildcard grants always pass.
 *
 * Usage:
 *   canActivate: [authGuard, moduleGuard('keys.', 'key.')]
 */
export function moduleGuard(...fragments: string[]): CanActivateFn {
  return (): boolean | UrlTree => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const allowed = permissionService.hasModuleAccess(...fragments);
    return allowed ? true : router.createUrlTree(['/dashboard']);
  };
}
