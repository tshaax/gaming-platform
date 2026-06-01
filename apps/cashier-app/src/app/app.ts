import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GlobalTimeoutAlertComponent } from './components/global-timeout-alert.component';

@Component({
  imports: [RouterModule, GlobalTimeoutAlertComponent],
  selector: 'app-root',
  template: `
    <app-global-timeout-alert></app-global-timeout-alert>
    <router-outlet />
  `,
  styles: [],
})
export class App {}
