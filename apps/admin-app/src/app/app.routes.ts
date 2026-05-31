import { Route } from '@angular/router';
import { authGuard } from '@org/fe/auth';
import { LoginComponent } from './login/login.component';
import { LandingComponent } from './landing/landing.component';
import { CashierMaintenanceComponent } from './cashier-maintenance/cashier-maintenance.component';
import { StoreMaintenanceComponent } from './store-maintenance/store-maintenance.component';
import { EventsComponent } from './events/events.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { PromotionsComponent } from './promotions/promotions.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: '', component: LandingComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: LandingComponent, canActivate: [authGuard] },
  { path: 'cashiers', component: CashierMaintenanceComponent, canActivate: [authGuard] },
  { path: 'stores', component: StoreMaintenanceComponent, canActivate: [authGuard] },
  { path: 'events', component: EventsComponent, canActivate: [authGuard] },
  { path: 'leaderboard', component: LeaderboardComponent, canActivate: [authGuard] },
  { path: 'promotions', component: PromotionsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
