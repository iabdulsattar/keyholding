import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    AuthService,
    ApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  static forRoot() {
    return {
      ngModule: CoreModule
    };
  }
}
