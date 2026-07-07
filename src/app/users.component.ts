import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, Profile, User } from './auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-8">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Administración de Accesos</h2>
          <p class="text-slate-500 text-sm mt-1">Gestiona perfiles y usuarios del sistema.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- Perfiles -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3">
            <h3 class="font-bold text-slate-800">Perfiles de Acceso</h3>
            <button (click)="openProfileModal()" class="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center">
              <mat-icon class="text-[16px] mr-1">add</mat-icon> Nuevo Perfil
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-0">
            <ul class="divide-y divide-slate-100">
              @for (profile of auth.profiles(); track profile.id) {
                <li class="p-4 hover:bg-slate-50 flex justify-between items-center transition-colors">
                  <div>
                    <h4 class="font-bold text-slate-700 text-sm">{{ profile.name }}</h4>
                    <p class="text-xs text-slate-500 mt-1 max-w-xs truncate">
                      @if(profile.permissions.includes('all')) { Todo el sistema } 
                      @else { Permisos: {{ profile.permissions.join(', ') || 'Ninguno' }} }
                    </p>
                  </div>
                  <div class="flex space-x-2">
                    <button (click)="editProfile(profile)" class="text-slate-400 hover:text-indigo-600 p-2 rounded-lg transition-colors bg-white border border-slate-200 hover:border-indigo-200">
                      <mat-icon class="text-[16px] w-[16px] h-[16px]">edit</mat-icon>
                    </button>
                    @if (profile.name !== 'Administrador') {
                      <button (click)="auth.deleteProfile(profile.id)" class="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition-colors bg-white border border-slate-200 hover:border-rose-200">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">delete</mat-icon>
                      </button>
                    }
                  </div>
                </li>
              }
            </ul>
          </div>
        </div>

        <!-- Usuarios -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3">
            <h3 class="font-bold text-slate-800">Usuarios</h3>
            <button (click)="openUserModal()" class="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center">
              <mat-icon class="text-[16px] mr-1">person_add</mat-icon> Nuevo Usuario
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-0">
            <ul class="divide-y divide-slate-100">
              @for (user of auth.users(); track user.id) {
                <li class="p-4 hover:bg-slate-50 flex justify-between items-center transition-colors">
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {{ user.name.charAt(0) | uppercase }}
                    </div>
                    <div>
                      <h4 class="font-bold text-slate-700 text-sm">{{ user.name }}</h4>
                      <div class="text-xs text-slate-500 mt-0.5 flex space-x-2">
                        <span>@{{ user.username }}</span>
                        <span>&bull;</span>
                        <span class="font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-600">{{ getProfileName(user.profileId) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <button (click)="editUser(user)" class="text-slate-400 hover:text-indigo-600 p-2 rounded-lg transition-colors bg-white border border-slate-200 hover:border-indigo-200">
                      <mat-icon class="text-[16px] w-[16px] h-[16px]">edit</mat-icon>
                    </button>
                    @if (user.username !== 'admin') {
                      <button (click)="auth.deleteUser(user.id)" class="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition-colors bg-white border border-slate-200 hover:border-rose-200">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">delete</mat-icon>
                      </button>
                    }
                  </div>
                </li>
              }
            </ul>
          </div>
        </div>

      </div>

      <!-- Modals -->
      <!-- Profile Modal -->
      @if (showProfileModal) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 class="font-bold text-slate-900">{{ editingProfile ? 'Editar Perfil' : 'Nuevo Perfil' }}</h3>
              <button (click)="closeProfileModal()" class="text-slate-400 hover:text-slate-700">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div>
                  <label for="profileName" class="block text-sm font-medium text-slate-700 mb-1">Nombre del Perfil</label>
                  <input id="profileName" type="text" [(ngModel)]="currentProfile.name" class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                </div>
                <div>
                  <p class="block text-sm font-medium text-slate-700 mb-2">Permisos (Secciones)</p>
                  <div class="space-y-2 max-h-48 overflow-y-auto">
                    @for (perm of availablePermissions; track perm.id) {
                      <label class="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input type="checkbox" [checked]="currentProfile.permissions.includes(perm.id) || currentProfile.permissions.includes('all')" 
                               (change)="togglePermission(perm.id, $event)" [disabled]="currentProfile.permissions.includes('all')"
                               class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                        <span class="text-sm font-medium text-slate-700">{{ perm.name }}</span>
                      </label>
                    }
                  </div>
                </div>
                <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button (click)="closeProfileModal()" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                  <button (click)="saveProfile()" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Guardar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- User Modal -->
      @if (showUserModal) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 class="font-bold text-slate-900">{{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
              <button (click)="closeUserModal()" class="text-slate-400 hover:text-slate-700">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div>
                  <label for="userName" class="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                  <input id="userName" type="text" [(ngModel)]="currentUser.name" class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                </div>
                <div>
                  <label for="userUsername" class="block text-sm font-medium text-slate-700 mb-1">Nombre de Usuario (Login)</label>
                  <input id="userUsername" type="text" [(ngModel)]="currentUser.username" [disabled]="currentUser.username === 'admin'" class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50">
                </div>
                <div>
                  <label for="userPassword" class="block text-sm font-medium text-slate-700 mb-1">Contraseña {{ editingUser ? '(dejar en blanco para no cambiar)' : '' }}</label>
                  <input id="userPassword" type="password" [(ngModel)]="currentUser.password" class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                </div>
                <div>
                  <label for="userProfile" class="block text-sm font-medium text-slate-700 mb-1">Perfil Asignado</label>
                  <select id="userProfile" [(ngModel)]="currentUser.profileId" [disabled]="currentUser.username === 'admin'" class="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50">
                    <option value="">Selecciona un perfil...</option>
                    @for (p of auth.profiles(); track p.id) {
                      <option [value]="p.id">{{ p.name }}</option>
                    }
                  </select>
                </div>
                <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button (click)="closeUserModal()" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                  <button (click)="saveUser()" [disabled]="!canSaveUser()" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">Guardar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UsersComponent {
  auth = inject(AuthService);

  availablePermissions = [
    { id: 'clients', name: 'Clientes (CRUD Completo)' },
    { id: 'delays', name: 'Deudores (Cobranza)' },
    { id: 'routes', name: 'Rutas de Visitadores' },
    { id: 'supplies', name: 'Inventario' },
    { id: 'financial', name: 'Flujo Financiero (Corte)' },
    { id: 'reports', name: 'Reportes Financieros' },
    { id: 'users', name: 'Usuarios y Perfiles' }
  ];

  showProfileModal = false;
  editingProfile: Profile | null = null;
  currentProfile: Omit<Profile, 'id'> = { name: '', permissions: [] };

  showUserModal = false;
  editingUser: User | null = null;
  currentUser: Omit<User, 'id'> = { name: '', username: '', password: '', profileId: '' };

  getProfileName(profileId: string) {
    const profile = this.auth.profiles().find(p => p.id === profileId);
    return profile ? profile.name : 'Desconocido';
  }

  // Profiles
  openProfileModal() {
    this.editingProfile = null;
    this.currentProfile = { name: '', permissions: [] };
    this.showProfileModal = true;
  }

  editProfile(profile: Profile) {
    this.editingProfile = profile;
    this.currentProfile = { name: profile.name, permissions: [...profile.permissions] };
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  togglePermission(permId: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!this.currentProfile.permissions.includes(permId)) {
        this.currentProfile.permissions.push(permId);
      }
    } else {
      this.currentProfile.permissions = this.currentProfile.permissions.filter(p => p !== permId);
    }
  }

  async saveProfile() {
    if (!this.currentProfile.name) return;
    
    if (this.editingProfile?.name === 'Administrador') {
         this.currentProfile.permissions = ['clients', 'delays', 'routes', 'supplies', 'financial', 'reports', 'users', 'all']; 
    }

    if (this.editingProfile) {
      await this.auth.updateProfile(this.editingProfile.id, this.currentProfile);
    } else {
      await this.auth.addProfile(this.currentProfile);
    }
    this.closeProfileModal();
  }

  // Users
  openUserModal() {
    this.editingUser = null;
    this.currentUser = { name: '', username: '', password: '', profileId: '' };
    this.showUserModal = true;
  }

  editUser(user: User) {
    this.editingUser = user;
    this.currentUser = { name: user.name, username: user.username, password: '', profileId: user.profileId };
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
  }

  canSaveUser(): boolean {
    if (!this.currentUser.name || !this.currentUser.username || !this.currentUser.profileId) return false;
    if (!this.editingUser && !this.currentUser.password) return false;
    return true;
  }

  async saveUser() {
    if (!this.canSaveUser()) return;
    
    if (this.editingUser) {
      const updates: Partial<User> = { name: this.currentUser.name, username: this.currentUser.username, profileId: this.currentUser.profileId };
      if (this.currentUser.password) {
        updates.password = this.currentUser.password;
      }
      await this.auth.updateUser(this.editingUser.id, updates);
    } else {
      await this.auth.addUser(this.currentUser);
    }
    this.closeUserModal();
  }
}
