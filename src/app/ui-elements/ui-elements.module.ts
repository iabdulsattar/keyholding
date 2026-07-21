import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AlertsComponent } from './pages/alerts/alerts.component';
import { AvatarElementComponent } from './pages/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/badges/badges.component';
import { ButtonsComponent } from './pages/buttons/buttons.component';
import { ImagesComponent } from './pages/images/images.component';
import { VideosComponent } from './pages/videos/videos.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild([
      { path: 'alerts', component: AlertsComponent },
      { path: 'avatars', component: AvatarElementComponent },
      { path: 'badge', component: BadgesComponent },
      { path: 'buttons', component: ButtonsComponent },
      { path: 'images', component: ImagesComponent },
      { path: 'videos', component: VideosComponent }
    ]),
    AlertsComponent,
    AvatarElementComponent,
    BadgesComponent,
    ButtonsComponent,
    ImagesComponent,
    VideosComponent
  ]
})
export class UIElementsModule { }
