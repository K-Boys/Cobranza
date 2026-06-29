import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="flex h-screen bg-slate-50 text-slate-800 font-sans relative">
      <!-- Mobile Overlay -->
      @if (isMobileMenuOpen()) {
        <div 
          class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden print:hidden" 
          (click)="toggleMobileMenu()"
          (keydown.enter)="toggleMobileMenu()"
          (keydown.space)="toggleMobileMenu()"
          tabindex="0"
          role="button"
          aria-label="Cerrar menú móvil">
        </div>
      }

      <!-- Sidebar -->
      <aside 
        class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 shadow-xl print:hidden lg:static lg:translate-x-0"
        [class.-translate-x-full]="!isMobileMenuOpen()">
        
        <div class="p-6 border-b border-slate-800 flex items-center justify-between">
          <h1 class="text-xl font-bold tracking-tight text-white leading-tight">Cobranza</h1>
          <button (click)="toggleMobileMenu()" class="text-slate-400 hover:text-white lg:hidden">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <nav class="flex-1 py-4 space-y-1 overflow-y-auto">
          @if (auth.hasPermission('clients')) {
            <a routerLink="/clients" routerLinkActive="bg-indigo-600 border-l-4 border-indigo-400 text-white" 
               class="flex items-center px-6 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
               (click)="closeMobileMenu()">
              <span class="text-sm italic mr-3">●</span>
              <span class="font-medium">Clientes</span>
            </a>
          }
          
          @if (auth.hasPermission('delays')) {
            <a routerLink="/delays" routerLinkActive="bg-indigo-600 border-l-4 border-indigo-400 text-white" 
               class="flex items-center px-6 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
               (click)="closeMobileMenu()">
              <span class="text-sm italic mr-3">●</span>
              <span class="font-medium">Deudores</span>
            </a>
          }
          
          @if (auth.hasPermission('routes')) {
            <a routerLink="/routes" routerLinkActive="bg-indigo-600 border-l-4 border-indigo-400 text-white" 
               class="flex items-center px-6 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
               (click)="closeMobileMenu()">
              <span class="text-sm italic mr-3">●</span>
              <span class="font-medium">Rutas</span>
            </a>
          }

          @if (auth.hasPermission('supplies')) {
            <a routerLink="/supplies" routerLinkActive="bg-indigo-600 border-l-4 border-indigo-400 text-white" 
               class="flex items-center px-6 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
               (click)="closeMobileMenu()">
              <span class="text-sm italic mr-3">●</span>
              <span class="font-medium">Inventario</span>
            </a>
          }
          
          @if (auth.hasPermission('financial')) {
            <a routerLink="/financial" routerLinkActive="bg-indigo-600 border-l-4 border-indigo-400 text-white" 
               class="flex items-center px-6 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
               (click)="closeMobileMenu()">
              <span class="text-sm italic mr-3">●</span>
              <span class="font-medium">Financiero</span>
            </a>
          }
          
          @if (auth.hasPermission('reports')) {
            <a routerLink="/reports" routerLinkActive="bg-indigo-600 border-l-4 border-indigo-400 text-white" 
               class="flex items-center px-6 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
               (click)="closeMobileMenu()">
              <span class="text-sm italic mr-3">●</span>
              <span class="font-medium">Reportes Financieros</span>
            </a>
          }

          @if (auth.hasPermission('users')) {
            <div class="pt-4 mt-4 border-t border-slate-800"></div>
            <a routerLink="/users" routerLinkActive="bg-indigo-600 border-l-4 border-indigo-400 text-white" 
               class="flex items-center px-6 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
               (click)="closeMobileMenu()">
              <mat-icon class="text-[18px] mr-3">admin_panel_settings</mat-icon>
              <span class="font-medium text-sm">Accesos y Usuarios</span>
            </a>
          }
        </nav>
        
        <div class="p-4 border-t border-slate-800">
          <div class="bg-slate-800 rounded-lg p-3">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-indigo-300">
                {{ (auth.currentUser()?.name?.charAt(0) || 'U') | uppercase }}
              </div>
              <div class="text-xs font-medium truncate flex-1">
                <p class="text-white truncate">{{ auth.currentUser()?.name }}</p>
                <p class="text-indigo-400 truncate">{{ auth.currentProfile?.name }}</p>
              </div>
            </div>
            <button (click)="logout()" class="w-full flex items-center justify-center py-2 text-xs font-bold text-slate-300 bg-slate-700 hover:bg-rose-600 hover:text-white rounded transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header class="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shadow-sm print:hidden">
          <div class="flex items-center gap-4">
            <button (click)="toggleMobileMenu()" class="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md lg:hidden">
              <mat-icon>menu</mat-icon>
            </button>
          </div>
          <div class="flex items-center gap-6">
            <div class="text-right">
               <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">by Boys</p>
            </div>
          </div>
        </header>
        <div class="flex-1 overflow-y-auto p-4 lg:p-6 main-content-print">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    @media print {
      aside { display: none !important; }
      main { padding: 0 !important; background: white !important; }
      .main-content-print { padding: 0 !important; overflow: visible !important; }
    }
  `]
})
export class LayoutComponent {
  auth = inject(AuthService);
  router = inject(Router);
  
  isMobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }
  
  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

