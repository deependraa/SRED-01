import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome.component';
import { HomeComponent } from './HomeComponent';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: { requiresAuth: false }, // Home page does not require auth
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
    canActivate: [AuthGuard],
    data: { requiresAuth: true }, // Welcome page requires auth
  },
];
