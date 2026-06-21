import { Route } from '@angular/router';
import { authGuard } from '@org/fe/auth';
import { LoginComponent } from './login/login.component';
import { LandingComponent } from './landing/landing.component';
import { LiveSessionsComponent } from './live-sessions/live-sessions.component';
import { ReportsComponent } from './reports/reports.component';
import { ResultsHistoryComponent } from './results-history/results-history.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: '', component: LandingComponent, canActivate: [authGuard] },
  { path: 'live-sessions', component: LiveSessionsComponent, canActivate: [authGuard] },
  { path: 'results-history', component: ResultsHistoryComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
