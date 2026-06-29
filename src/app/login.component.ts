import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-indigo-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto shadow-lg">
          <span class="text-white font-black text-2xl">CO</span>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Sistema de Cobranza
        </h2>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200">
          <form class="space-y-6" (ngSubmit)="onSubmit()">
            @if (error) {
              <div class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm font-medium">
                {{ error }}
              </div>
            }

            <div>
              <label for="username" class="block text-sm font-medium text-slate-700">
                Usuario
              </label>
              <div class="mt-1">
                <input id="username" name="username" type="text" [(ngModel)]="username" required
                       class="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors">
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div class="mt-1">
                <input id="password" name="password" type="password" [(ngModel)]="password" required
                       class="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors">
              </div>
            </div>

            <div>
              <button type="submit" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                Iniciar Sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  username = '';
  password = '';
  error = '';

  onSubmit() {
    this.error = '';
    if (!this.username || !this.password) {
      this.error = 'Por favor ingresa usuario y contraseña.';
      return;
    }

    const success = this.auth.login(this.username, this.password);
    if (success) {
      this.router.navigate(['/clients']);
    } else {
      this.error = 'Credenciales incorrectas.';
    }
  }
}
