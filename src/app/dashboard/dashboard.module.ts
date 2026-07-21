import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { EcommerceComponent } from './pages/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { CalenderComponent } from './pages/calender/calender.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild([
      { path: '', component: EcommerceComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'calendar', component: CalenderComponent }
    ]),
    EcommerceComponent,
    ProfileComponent,
    CalenderComponent
  ]
})
export class DashboardModule { }
