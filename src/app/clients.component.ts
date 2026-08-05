import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DataService, Client } from './data.service';

@Component({
  selector: 'app-client-list',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">Directorio de Clientes</h2>
          <p class="text-sm text-slate-500 mt-1">Gestiona las cuentas y saldos de tus clientes</p>
        </div>
        <button (click)="toggleForm()" class="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors flex items-center shadow-sm whitespace-nowrap">
          <mat-icon class="mr-2 text-sm">person_add</mat-icon>
          Nuevo Cliente
</button>
        
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white p-6 rounded-xl shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-6 text-slate-800 tracking-tight">{{ editingClientId() ? 'Editar Cliente' : 'Registrar Nuevo Cliente' }}</h3>
            @if (errorMessage()) {
              <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center">
                <mat-icon class="mr-2 text-[18px]">error_outline</mat-icon>
                {{ errorMessage() }}
              </div>
            }
            <form [formGroup]="clientForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="name" class="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
                <input id="name" type="text" formControlName="name"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              </div>
              <div>
                <label for="street" class="block text-sm font-medium text-slate-700 mb-1">Calle y Número *</label>
                <input id="street" type="text" formControlName="street"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              </div>
              <div>
                <label for="neighborhood" class="block text-sm font-medium text-slate-700 mb-1">Colonia *</label>
                <input id="neighborhood" type="text" formControlName="neighborhood"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              </div>
              <div>
                <label for="city" class="block text-sm font-medium text-slate-700 mb-1">Ciudad *</label>
                <input id="city" type="text" formControlName="city"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              </div>
              <div class="md:col-span-2">
                <label for="notes" class="block text-sm font-medium text-slate-700 mb-1">Referencias de Domicilio</label>
                <input id="notes" type="text" formControlName="notes"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              </div>
              <div>
                <label for="phone" class="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input id="phone" type="tel" formControlName="phone"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input id="email" type="email" formControlName="email"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              </div>
              <div class="md:col-span-2">
                <label for="paymentTermsDays" class="block text-sm font-medium text-slate-700 mb-1">Días de Crédito (Morosidad)</label>
                <input id="paymentTermsDays" type="number" formControlName="paymentTermsDays" min="0"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                <p class="text-xs text-slate-500 mt-1">Días límite para que el cliente realice el pago de sus cargos.</p>
              </div>
              <div class="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" (click)="toggleForm()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar
</button>
                <button type="submit" [disabled]="clientForm.invalid" 
                  class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ editingClientId() ? 'Guardar Cambios' : 'Guardar Cliente' }}
</button>
                
              </div>
            </form>
          </div>
        </div>
      }

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3">
            <h3 class="font-bold text-slate-800 tracking-tight text-sm">Cuentas y Saldos</h3>
            <div class="flex w-full sm:w-auto gap-2">
              <div class="relative w-full sm:w-auto">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</mat-icon>
                <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Buscar..." class="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64">
              </div>
            </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse block md:table">
            <thead class="hidden md:table-header-group">
              <tr class="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                <th class="px-4 md:px-6 py-3 whitespace-nowrap">Cliente</th>
                <th class="px-4 md:px-6 py-3 whitespace-nowrap">Contacto</th>
                <th class="px-4 md:px-6 py-3 whitespace-nowrap">Deuda y Abono</th>
                <th class="px-4 md:px-6 py-3 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody class="flex flex-col md:table-row-group gap-3 md:gap-0 divide-y-0 md:divide-y divide-transparent md:divide-slate-100 text-sm bg-slate-50 md:bg-transparent p-3 md:p-0">
              @for (client of filteredClients(); track client.id) {
                <tr class="hover:bg-slate-50 transition-colors group cursor-pointer flex flex-col md:table-row py-4 md:py-0 border-b border-slate-100 md:border-none relative" (click)="viewClient(client.id)">
                  <td class="px-4 md:px-6 py-2 md:py-4 block md:table-cell">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-lg bg-slate-700 text-indigo-300 flex items-center justify-center font-bold mr-3 text-xs shrink-0">
                        {{ client.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="min-w-0 pr-16 md:pr-0">
                        <div class="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{{ client.name }}</div>
                        <div class="text-xs text-slate-500 truncate">Registrado el {{ formatDate(client.createdAt) }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 min-w-[200px] block md:table-cell">
                    <div class="text-slate-700 flex items-start"><mat-icon class="text-slate-400 text-[16px] w-[16px] h-[16px] mr-1.5 mt-0.5 shrink-0" aria-hidden="true">location_on</mat-icon> <span class="leading-tight">{{ getAddressString(client) }}</span></div>
                    @if (client.phone) {
                      <div class="text-xs text-slate-500 mt-2 flex items-center"><mat-icon class="text-slate-400 text-[14px] w-[14px] h-[14px] mr-1.5 shrink-0" aria-hidden="true">call</mat-icon> {{ client.phone }}</div>
                    }
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 mt-2 md:mt-0 whitespace-nowrap block md:table-cell"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Deuda y Abono</div>
                    <div class="flex flex-col gap-1 items-start">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase" 
                            [class.bg-rose-50]="getDebt(client.id)() > 0" 
                            [class.text-rose-600]="getDebt(client.id)() > 0"
                            [class.bg-emerald-50]="getDebt(client.id)() <= 0"
                            [class.text-emerald-600]="getDebt(client.id)() <= 0">
                        {{ formatCurrency(getDebt(client.id)()) }}
                      </span>
                      @if (getTotalPaid(client.id)() > 0) {
                        <span class="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          <mat-icon class="text-[12px] w-[12px] h-[12px]">payments</mat-icon>
                          <span>Total abonado: {{ formatCurrency(getTotalPaid(client.id)()) }}</span>
                        </span>
                      }
                    </div>
                  </td>
                  <td class="absolute right-2 top-4 md:static px-4 md:px-6 py-2 md:py-4 text-right whitespace-nowrap flex md:table-cell justify-end items-start md:items-center">
                    <div class="flex justify-end space-x-1">
                      <button class="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100" (click)="editClient(client, $event)" title="Editar Cliente">
                        <mat-icon class="text-[18px]">edit</mat-icon>
</button>
                      
                      <button class="text-slate-400 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100" (click)="deleteClient(client.id, $event)" title="Eliminar/Baja">
                        <mat-icon class="text-[18px]">delete</mat-icon>
</button>
                      
                        
                      
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr class="block md:table-row">
                  <td colspan="4" class="px-4 md:px-6 py-12 text-center text-slate-500 block md:table-cell">
                    <mat-icon class="text-4xl text-slate-300 mb-2">person_off</mat-icon>
                    <p>No hay clientes registrados aún.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ClientListComponent {
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  clients = this.dataService.clients;
  showForm = signal(false);
  searchQuery = signal('');
  errorMessage = signal('');

  filteredClients = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.clients();
    return this.clients().filter(c => c.name.toLowerCase().includes(query));
  });

  clientForm = this.fb.group({
    name: ['', Validators.required],
    phone: [''],
    email: [''],
    street: ['', Validators.required],
    neighborhood: ['', Validators.required],
    city: ['', Validators.required],
    paymentTermsDays: [15, [Validators.required, Validators.min(0)]],
    notes: ['']
  });

  editingClientId = signal<string | null>(null);

  toggleForm() {
    this.showForm.update(v => !v);
    this.errorMessage.set('');
    if (!this.showForm()) {
      this.clientForm.reset();
      this.editingClientId.set(null);
    }
  }

  editClient(client: Client, event: Event) {
    event.stopPropagation();
    this.editingClientId.set(client.id);
    this.clientForm.patchValue({
      name: client.name,
      phone: client.phone,
      email: client.email,
      street: client.street,
      neighborhood: client.neighborhood,
      city: client.city,
      paymentTermsDays: client.paymentTermsDays || 0,
      notes: client.notes
    });
    this.showForm.set(true);
  }

  deleteClient(id: string, event: Event) {
    event.stopPropagation();
    this.dataService.deleteClient(id);
  }

  onSubmit() {
    this.errorMessage.set('');
    if (this.clientForm.valid) {
      const formValue = this.clientForm.getRawValue();
      const currentEditId = this.editingClientId();
      
      const exists = this.clients().some(c => 
        c.name.toLowerCase() === formValue.name?.toLowerCase() && c.id !== currentEditId
      );
      
      if (exists) {
        this.errorMessage.set('Ya existe un cliente registrado con este nombre.');
        return;
      }

      const clientData = {
        name: formValue.name || '',
        phone: formValue.phone || '',
        email: formValue.email || '',
        street: formValue.street || '',
        neighborhood: formValue.neighborhood || '',
        city: formValue.city || '',
        paymentTermsDays: formValue.paymentTermsDays ?? 15,
        notes: formValue.notes || ''
      };

      if (currentEditId) {
        this.dataService.updateClient(currentEditId, clientData);
      } else {
        this.dataService.addClient(clientData);
      }
      this.toggleForm();
    }
  }

  viewClient(id: string) {
    this.router.navigate(['/clients', id]);
  }

  getDebt(clientId: string) {
    return computed(() => this.dataService.getClientSummary(clientId)().currentDebt);
  }

  getTotalPaid(clientId: string) {
    return computed(() => this.dataService.getClientSummary(clientId)().totalPaid || 0);
  }

  getAddressString(client: Client): string {
    if (!client.street) return 'Sin domicilio';
    return `${client.street}, ${client.neighborhood}`;
  }

  formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }
}
