import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <div class="text-center mb-8">
            <img src="/playground-logo.png" alt="Playground Logo" class="w-32 h-auto mx-auto mb-4" />
            <h1 class="text-4xl font-bold text-white mb-2">Admin Portal</h1>
            <p class="text-blue-200">Secure admin login</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Credential Type Toggle -->
            <div>
              <p class="block text-sm font-medium text-blue-100 mb-3">Login With</p>
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="toggleCredentialType()"
                  [class.bg-blue-600]="credentialType() === 'email'"
                  [class.bg-white/10]="credentialType() === 'cellphone'"
                  class="flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors"
                >
                  Email
                </button>
                <button
                  type="button"
                  (click)="toggleCredentialType()"
                  [class.bg-blue-600]="credentialType() === 'cellphone'"
                  [class.bg-white/10]="credentialType() === 'email'"
                  class="flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors"
                >
                  Phone
                </button>
              </div>
            </div>

            <!-- Email/Cellphone Input -->
            <div>
              <label [for]="'credential-input'" class="block text-sm font-medium text-blue-100 mb-2">
                {{ credentialType() === 'email' ? 'Email Address' : 'Phone Number' }}
              </label>
              <input
                id="credential-input"
                [formControl]="credentialControl()"
                [type]="credentialType() === 'email' ? 'email' : 'tel'"
                [placeholder]="credentialType() === 'email' ? 'admin@example.com' : '+1 (555) 000-0000'"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
              />
            </div>

            <!-- Password Input -->
            <div>
              <label for="password" class="block text-sm font-medium text-blue-100 mb-2">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
              />
            </div>

            <!-- Error Message -->
            @if (errorMessage()) {
              <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p class="text-red-200 text-sm">{{ errorMessage() }}</p>
              </div>
            }

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading() || !form.valid"
              class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              @if (isLoading()) {
                <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              }
              {{ isLoading() ? 'Logging in...' : 'Login' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form!: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  credentialType = signal<'email' | 'cellphone'>('email');

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      email: [''],
      cellphone: [''],
      password: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  credentialControl(): FormControl {
    return (this.credentialType() === 'email' ? this.form.get('email') : this.form.get('cellphone')) as FormControl;
  }

  toggleCredentialType(): void {
    const newType = this.credentialType() === 'email' ? 'cellphone' : 'email';
    this.credentialType.set(newType);
    this.form.reset({ password: '' });
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, cellphone, password } = this.form.value;
    const request = {
      email: this.credentialType() === 'email' ? email : undefined,
      cellphone: this.credentialType() === 'cellphone' ? cellphone : undefined,
      password,
    };

    this.authService.login(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Login failed. Please try again.');
      },
    });
  }
}
