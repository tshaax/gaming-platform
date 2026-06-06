import { Route } from '@angular/router';
import { authGuard } from '@org/fe/auth';
import { LoginComponent } from './login/login.component';
import { LandingComponent } from './landing/landing.component';
import { GamingPortalComponent } from './portal/gaming-portal.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: '', component: LandingComponent, canActivate: [authGuard] },
  { path: 'portal/:storeId', component: GamingPortalComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
