import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DataService, Supply } from './data.service';

@Component({
  selector: 'app-supplies',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">Inventario</h2>
          <p class="text-sm text-slate-500 mt-1">Catálogo de productos disponibles para los clientes.</p>
        </div>
        <div class="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-3 w-full lg:w-auto">
          <div class="relative w-full sm:w-auto flex-1">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</mat-icon>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Buscar..." class="pl-9 pr-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full bg-slate-50 transition-all">
          </div>
          <div class="flex gap-3 w-full sm:w-auto">
            <button (click)="toggleHistory()" class="flex-1 sm:flex-none justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center shadow-sm">
              <mat-icon class="mr-2 text-sm">history</mat-icon>
              Historial
            </button>
            <button (click)="toggleForm()" class="flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center shadow-sm whitespace-nowrap">
              <mat-icon class="mr-2 text-sm">add_box</mat-icon>
              Nuevo
            </button>
          </div>
        </div>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 class="text-xl font-bold mb-6 text-slate-800 tracking-tight">{{ editingSupplyId() ? 'Editar Suministro' : 'Agregar Suministro' }}</h3>
            @if (errorMessage()) {
              <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center">
                <mat-icon class="mr-2 text-[18px]">error_outline</mat-icon>
                {{ errorMessage() }}
              </div>
            }
            <form [formGroup]="supplyForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label for="name-input" class="block text-sm font-medium text-slate-700 mb-1">Nombre / Descripción *</label>
                <input id="name-input" type="text" formControlName="name"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
              </div>
              <div class="flex gap-4">
                <div class="flex-1">
                  <label for="price-input" class="block text-sm font-medium text-slate-700 mb-1">Precio ($) *</label>
                  <input id="price-input" type="number" formControlName="price"
                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                </div>
                <div class="flex-1">
                  <label for="stock-input" class="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
                  <input id="stock-input" type="number" formControlName="stock" min="0" step="1"
                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                </div>
              </div>
              <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" (click)="toggleForm()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-semibold transition-colors">Cancelar</button>
                <button type="submit" [disabled]="supplyForm.invalid" 
                  class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ editingSupplyId() ? 'Guardar Cambios' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (sup of filteredSupplies(); track sup.id) {
          <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group">
            <div class="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button (click)="editSupply(sup)" class="p-1 text-slate-400 hover:text-indigo-600 rounded" title="Editar">
                <mat-icon class="text-[18px]">edit</mat-icon>
              </button>
              <button (click)="deleteSupply(sup.id)" class="p-1 text-slate-400 hover:text-rose-600 rounded" title="Eliminar/Baja">
                <mat-icon class="text-[18px]">delete</mat-icon>
              </button>
            </div>
            <div class="flex justify-between items-start mb-4 pr-12">
              <h3 class="font-bold text-slate-900 text-lg leading-tight w-2/3">{{ sup.name }}</h3>
              <div class="text-right">
                <div class="text-xl font-bold text-slate-900">{{ formatCurrency(sup.price) }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PRECIO</div>
              </div>
            </div>

            <div class="mt-auto pt-4 flex justify-between items-end border-t border-slate-100">
              <div>
                <div class="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">STOCK DISPONIBLE</div>
                <div class="flex items-center">
                  <span class="text-2xl font-bold tracking-tight text-slate-900" [class.text-amber-600]="sup.stock < 10">{{ sup.stock }}</span>
                  <span class="text-xs ml-1 text-slate-500">ud.</span>
                </div>
              </div>
              
              <div class="flex space-x-2">
                <button (click)="openProductHistory(sup.id)" class="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-md transition-colors shadow-sm" title="Ver Historial">
                  <mat-icon class="text-[18px]">history</mat-icon>
                </button>
                <button (click)="openRestock(sup)" class="p-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md transition-colors shadow-sm text-xs font-semibold flex items-center" title="Actualizar Stock">
                  <mat-icon class="text-[16px] mr-1">add_circle_outline</mat-icon> Ajustar
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-12 text-center text-slate-500 border border-slate-200 rounded-xl bg-white shadow-sm">
            <mat-icon class="text-4xl text-slate-300 mb-2">inventory_2</mat-icon>
            <p class="text-sm">No hay suministros en el inventario.</p>
          </div>
        }
      </div>
    </div>
    
    <!-- Restock Modal -->
    @if (selectedSupply()) {
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 class="text-sm font-bold text-slate-800 tracking-tight">Ajustar Stock</h3>
            <button (click)="closeRestock()" class="text-slate-400 hover:text-slate-700"><mat-icon class="text-sm">close</mat-icon></button>
          </div>
          <form [formGroup]="adjustForm" (ngSubmit)="onAdjustSubmit()" class="p-6">
            <p class="text-slate-500 text-sm mb-4">Actualizando inventario para: <strong class="text-slate-800">{{ selectedSupply()?.name }}</strong></p>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <button type="button" (click)="adjustForm.patchValue({operation: 'ADD'})" [class.border-indigo-600]="adjustForm.value.operation === 'ADD'" [class.bg-indigo-50]="adjustForm.value.operation === 'ADD'" class="border border-slate-200 rounded-lg p-3 text-center transition-colors">
                  <mat-icon [class.text-indigo-600]="adjustForm.value.operation === 'ADD'" [class.text-slate-400]="adjustForm.value.operation !== 'ADD'">add_circle</mat-icon>
                  <div class="text-xs font-bold mt-1 text-slate-700">Agregar</div>
                </button>
                <button type="button" (click)="adjustForm.patchValue({operation: 'REMOVE'})" [class.border-rose-600]="adjustForm.value.operation === 'REMOVE'" [class.bg-rose-50]="adjustForm.value.operation === 'REMOVE'" class="border border-slate-200 rounded-lg p-3 text-center transition-colors">
                  <mat-icon [class.text-rose-600]="adjustForm.value.operation === 'REMOVE'" [class.text-slate-400]="adjustForm.value.operation !== 'REMOVE'">remove_circle</mat-icon>
                  <div class="text-xs font-bold mt-1 text-slate-700">Descontar</div>
                </button>
              </div>

              <div>
                <label for="stock-qty-input" class="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                <input id="stock-qty-input" type="number" formControlName="quantity" min="1" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              </div>

              <div>
                <label for="stock-notes-input" class="block text-sm font-medium text-slate-700 mb-1">Comentarios / Motivo *</label>
                <textarea id="stock-notes-input" formControlName="notes" rows="2" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Ej: Compra de mercancía, merma, etc."></textarea>
              </div>
            </div>
            
            <div class="mt-6">
              <button type="submit" [disabled]="adjustForm.invalid" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Confirmar Ajuste
              </button>
            </div>
          </form>
        </div>
      </div>
    }
    
    <!-- History Modal -->
    @if (showHistory()) {
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 class="text-lg font-bold text-slate-800 tracking-tight flex items-center"><mat-icon class="mr-2 text-indigo-600">history</mat-icon> Historial de Movimientos</h3>
            <button (click)="toggleHistory()" class="text-slate-400 hover:text-slate-700"><mat-icon>close</mat-icon></button>
          </div>
          <div class="p-0 max-h-[60vh] overflow-y-auto">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                <thead class="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                  <tr>
                    <th class="px-4 md:px-6 py-3 font-semibold text-slate-700">Fecha</th>
                    <th class="px-4 md:px-6 py-3 font-semibold text-slate-700">Insumo</th>
                    <th class="px-4 md:px-6 py-3 font-semibold text-slate-700">Tipo</th>
                    <th class="px-4 md:px-6 py-3 font-semibold text-slate-700 text-right">Variación</th>
                    <th class="px-4 md:px-6 py-3 font-semibold text-slate-700 text-right">Stock Final</th>
                    <th class="px-4 md:px-6 py-3 font-semibold text-slate-700">Comentarios</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (event of sortedHistory(); track event.id) {
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-4 md:px-6 py-3 text-slate-500">{{ formatDate(event.date) }}</td>
                      <td class="px-4 md:px-6 py-3 font-medium text-slate-900">{{ event.supplyName }}</td>
                      <td class="px-4 md:px-6 py-3">
                        <span class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-800': event.type === 'ALTA' || event.type === 'AJUSTE_POSITIVO',
                            'bg-rose-100 text-rose-800': event.type === 'BAJA' || event.type === 'AJUSTE_NEGATIVO' || event.type === 'VENTA',
                            'bg-amber-100 text-amber-800': event.type === 'EDICION'
                          }">
                          {{ event.type }}
                        </span>
                      </td>
                      <td class="px-4 md:px-6 py-3 text-right">
                        @if (event.quantityChanged !== undefined) {
                          <span class="font-medium" [ngClass]="{'text-rose-600': event.type === 'VENTA' || event.type === 'AJUSTE_NEGATIVO', 'text-emerald-600': event.type === 'AJUSTE_POSITIVO'}">
                            {{ event.type === 'VENTA' || event.type === 'AJUSTE_NEGATIVO' ? '-' : '+' }}{{ event.quantityChanged }}
                          </span>
                        } @else {
                          <span class="text-slate-400">-</span>
                        }
                      </td>
                      <td class="px-4 md:px-6 py-3 text-right font-medium text-slate-900">
                        {{ event.newStockValue !== undefined ? event.newStockValue : '-' }}
                      </td>
                      <td class="px-4 md:px-6 py-3 text-slate-600 text-xs truncate max-w-xs" [title]="event.notes || ''">
                        {{ event.notes || '--' }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="px-4 md:px-6 py-12 text-center text-slate-500">
                        <mat-icon class="text-4xl text-slate-300 mb-2">history</mat-icon>
                        <p>No hay movimientos registrados.</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class SuppliesComponent {
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);

  supplies = this.dataService.supplies;
  history = this.dataService.supplyHistory;
  
  showForm = signal(false);
  showHistory = signal(false);
  selectedSupply = signal<Supply | null>(null);
  searchQuery = signal('');
  errorMessage = signal('');
  
  sortedHistory = computed(() => {
    let hist = this.history();
    const supplyId = this.historySupplyId();
    if (supplyId) {
      hist = hist.filter(h => h.supplyId === supplyId);
    }
    return [...hist].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  formatDate(isoString: string) {
    if (!isoString) return '--';
    return new Intl.DateTimeFormat('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(isoString));
  }

  historySupplyId = signal<string | null>(null);

  toggleHistory() {
    this.historySupplyId.set(null);
    this.showHistory.update(v => !v);
  }

  openProductHistory(supplyId: string) {
    this.historySupplyId.set(supplyId);
    this.showHistory.set(true);
  }

  filteredSupplies = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.supplies();
    return this.supplies().filter(s => s.name.toLowerCase().includes(query));
  });

  supplyForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]]
  });

  editingSupplyId = signal<string | null>(null);

  toggleForm() {
    this.showForm.update(v => !v);
    this.errorMessage.set('');
    if (!this.showForm()) {
        this.supplyForm.reset({stock: 0});
        this.editingSupplyId.set(null);
    }
  }

  editSupply(supply: Supply) {
    this.editingSupplyId.set(supply.id);
    this.supplyForm.patchValue({
      name: supply.name,
      price: supply.price,
      stock: supply.stock
    });
    this.showForm.set(true);
  }

  deleteSupply(id: string) {
    this.dataService.deleteSupply(id);
  }

  onSubmit() {
    this.errorMessage.set('');
    if (this.supplyForm.valid) {
      const formValue = this.supplyForm.getRawValue();
      const currentEditId = this.editingSupplyId();
      
      const exists = this.supplies().some(s => 
        s.name.toLowerCase() === formValue.name?.toLowerCase() && s.id !== currentEditId
      );

      if (exists) {
        this.errorMessage.set('Ya existe un suministro registrado con este nombre.');
        return;
      }

      if (currentEditId) {
        this.dataService.updateSupply(currentEditId, formValue as unknown as Partial<Supply>);
      } else {
        this.dataService.addSupply(formValue as unknown as Omit<Supply, 'id'>);
      }
      this.toggleForm();
    }
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  adjustForm = this.fb.group({
    operation: ['ADD', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    notes: ['', Validators.required]
  });

  openRestock(supply: Supply) {
    this.selectedSupply.set(supply);
    this.adjustForm.reset({ operation: 'ADD', quantity: 1, notes: '' });
  }

  closeRestock() {
    this.selectedSupply.set(null);
  }

  onAdjustSubmit() {
    if (this.adjustForm.invalid || !this.selectedSupply()) return;
    
    const { operation, quantity, notes } = this.adjustForm.value;
    const diff = operation === 'ADD' ? (quantity || 0) : -(quantity || 0);
    const supply = this.selectedSupply()!;
    
    if (diff !== 0) {
      this.dataService.adjustSupplyStock(supply.id, diff, notes || '');
    }
    this.closeRestock();
  }
}
