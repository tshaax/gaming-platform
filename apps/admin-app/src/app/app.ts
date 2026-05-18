import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: `<div class="w-full h-screen flex flex-col overflow-hidden"><router-outlet /></div>`,
  styles: [],
})
export class App {}
