import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { of, map, catchError } from 'rxjs';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ToastInterceptor } from './core/interceptors/toast.interceptor';
import { PermissionService } from './core/services/permission.service';
import { AuthService } from './core/services/auth.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ToastInterceptor, multi: true },
    provideAppInitializer(() => {
      const permissionService = inject(PermissionService);
      const authService = inject(AuthService);
      
      permissionService.restore();
      
      const token = authService.getAccessToken();
      if (token && !permissionService.hasAnyService()) {
        return authService.getSession(token).pipe(
          map((session: any) => {
            const grants = session?.serviceAccess;
            if (grants) {
              const next = Array.isArray(grants) ? grants : (grants ? [grants] : []);
              permissionService.setServiceAccess(next);
            }
            const orgs = session?.organizations ?? [];
            const orgRole = orgs?.length > 0 ? orgs[0].role : undefined;
            permissionService.setOrgRole(orgRole);
          }),
          catchError(() => of(null))
        );
      }
      return of(null);
    })
  ]
};
