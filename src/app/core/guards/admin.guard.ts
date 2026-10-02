import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from '../services/permission.service';

/**
 * Restricts subscription, plan and trial routes to organisation administrators.
 * Members are redirected to the dashboard instead of being pushed onto a plan
 * or trial page they are not allowed to use.
 *
 * Usage:
 *   canActivate: [authGuard, adminGuard]
 */
export const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  return permissionService.isOrgAdmin() ? true : router.createUrlTree(['/dashboard']);
};
