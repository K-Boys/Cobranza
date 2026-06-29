import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { DataService, SaleItem } from './data.service';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-client-detail',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule, RouterLink],
  template: `
    @if (client()) {
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header Non-Print -->
        <div class="print:hidden">
          <a routerLink="/clients" class="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
            <mat-icon class="text-sm mr-1">arrow_back</mat-icon> Volver al directorio
          </a>
          
          <div class="flex justify-between items-start bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div>
              <h2 class="text-3xl font-bold tracking-tight text-slate-900">{{ client()!.name }}</h2>
              <div class="text-slate-500 mt-2 flex items-center space-x-4 text-sm">
                <span class="flex items-center"><mat-icon class="text-sm mr-1">call</mat-icon> {{ client()!.phone }}</span>
                @if (client()!.email) {
                  <span class="flex items-center"><mat-icon class="text-sm mr-1">mail</mat-icon> {{ client()!.email }}</span>
                }
              </div>
            </div>
            
            <div class="text-right">
              <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Deuda Actual Pendiente</p>
              <div class="text-3xl font-bold tracking-tight" [class.text-rose-600]="summary().currentDebt > 0" [class.text-emerald-600]="summary().currentDebt <= 0">
                {{ formatCurrency(summary().currentDebt) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Print-only Statement Header -->
        <div class="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
          <div class="flex justify-between items-end">
            <div>
              <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Estado de Cuenta</h1>
              <p class="text-slate-500 mt-1">Generado el {{ formatCurrentDate() }}</p>
            </div>
            <div class="text-right">
              <h2 class="text-2xl font-bold text-slate-800">{{ client()!.name }}</h2>
              <p class="text-slate-600 mt-1 text-sm">Tel: {{ client()!.phone }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left Column: Actions & Details -->
          <div class="lg:col-span-1 space-y-6 print:hidden">
            
            <!-- Quick Actions -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Acciones</h3>
              <div class="space-y-3">
                <button (click)="openChargeModal()" class="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md text-sm font-semibold transition-colors shadow-sm">
                  <mat-icon class="text-[18px]">shopping_cart</mat-icon> <span>Registrar Venta</span>
                </button>
                <button (click)="openPaymentModal()" class="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md text-sm font-semibold transition-colors shadow-sm">
                  <mat-icon class="text-[18px]">payment</mat-icon> <span>Abonar Pago</span>
                </button>
                <button (click)="exportToExcel()" class="w-full flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-md text-sm font-semibold transition-colors border border-slate-300">
                  <mat-icon class="text-[18px]">table_chart</mat-icon> <span>Exportar Estado de Cuenta</span>
                </button>
              </div>
            </div>

            <!-- Addresses Module -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Domicilio Asignado</h3>
              </div>
              
              <div class="space-y-4">
                @if (client()?.street) {
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm animate-in fade-in">
                    <div class="font-bold text-slate-800">{{ client()?.street }}</div>
                    <div class="text-slate-500 text-xs mt-1 font-medium">{{ client()?.neighborhood }}, {{ client()?.city }}</div>
                    @if (client()?.notes) {
                      <div class="text-xs text-slate-500 mt-3 flex items-start bg-white p-2 rounded border border-slate-100"><mat-icon class="text-[14px] mr-1 text-slate-400" aria-hidden="true">info</mat-icon> <span class="italic">{{ client()?.notes }}</span></div>
                    }
                  </div>
                } @else {
                  <div class="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                    <mat-icon class="text-3xl mb-1 opacity-50">location_off</mat-icon>
                    <p class="text-[10px] font-bold uppercase tracking-wider">Sin domicilio</p>
                    <p class="text-xs mt-1">Este cliente no tiene domicilio.</p>
                  </div>
                }
              </div>
            </div>
            
          </div>

          <!-- Right Column: Ledger / Statement -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col print:shadow-none print:border-none print:p-0">
              
              <div class="p-4 border-b border-slate-100 bg-slate-50/50 print:hidden hidden print:flex">
                <h3 class="font-bold text-slate-800 text-sm tracking-tight">Histórico de Movimientos</h3>
              </div>
              <div class="p-4 border-b border-slate-100 flex justify-between items-center print:hidden">
                <h3 class="font-bold text-slate-800 text-sm">Registro de Transacciones</h3>
              </div>

              <!-- Statement Summary Print-only -->
              <div class="hidden print:grid grid-cols-3 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cargos</p>
                  <p class="text-xl font-bold">{{ formatCurrency(summary().totalBilled) }}</p>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Abonos</p>
                  <p class="text-xl font-bold">{{ formatCurrency(summary().totalPaid) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Saldo Actual</p>
                  <p class="text-2xl font-black" [class.text-rose-700]="summary().currentDebt > 0">{{ formatCurrency(summary().currentDebt) }}</p>
                </div>
              </div>

              <!-- Ledger Table -->
              <div class="overflow-x-auto flex-1">
                <table class="w-full text-left min-w-[600px]">
                  <thead class="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100 print:border-slate-300">
                    <tr>
                      <th class="px-4 py-3 whitespace-nowrap">Fecha</th>
                      <th class="px-4 py-3">Descripción</th>
                      <th class="px-4 py-3 text-right whitespace-nowrap">Cargo</th>
                      <th class="px-4 py-3 text-right whitespace-nowrap">Abono</th>
                      <th class="px-4 py-3 text-right print:hidden whitespace-nowrap">Balance</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-sm print:divide-slate-200">
                    @for (record of sortedLedger(); track record.id) {
                      <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{{ formatDate(record.date) }}</td>
                        <td class="px-4 py-3 min-w-[200px]">
                          @if (record.type === 'SALE') {
                            <div class="font-medium text-slate-800">Venta Suministros</div>
                            <div class="text-xs text-slate-500 mt-1 italic">
                              @for (item of record.details; track $index) {
                                <div>{{ item.quantity }}x {{ getSupplyName(item.supplyId) }}</div>
                              }
                            </div>
                            @if (record.expectedPaymentAmount) {
                              <div class="mt-2 inline-flex items-center space-x-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                <mat-icon class="text-[12px] w-[12px] h-[12px]">payments</mat-icon>
                                <span>Abono sugerido: {{ formatCurrency(record.expectedPaymentAmount) }}</span>
                              </div>
                            }
                          } @else {
                            <div class="font-medium text-emerald-700 flex items-center">
                              <mat-icon class="text-[16px] mr-1">check_circle</mat-icon> Pago
                            </div>
                          }
                        </td>
                        <td class="px-4 py-3 text-right font-semibold text-rose-600 whitespace-nowrap">
                          {{ record.type === 'SALE' ? formatCurrency(record.amount) : '-' }}
                        </td>
                        <td class="px-4 py-3 text-right font-semibold text-emerald-600 whitespace-nowrap">
                          {{ record.type === 'PAYMENT' ? formatCurrency(record.amount) : '-' }}
                        </td>
                        <td class="px-4 py-3 text-right text-slate-700 font-semibold print:hidden whitespace-nowrap">
                          {{ formatCurrency(record.runningBalance || 0) }}
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="px-4 py-12 text-center text-slate-500 text-sm">
                          No hay transacciones registradas.
                        </td>
                      </tr>
                    }
                  </tbody>
                  <!-- Footer totals print-only -->
                  <tfoot class="hidden print:table-footer-group border-t border-slate-300 bg-slate-50">
                    <tr>
                      <td colspan="2" class="px-4 py-3 text-right text-sm font-bold text-slate-800 uppercase tracking-widest">Totales</td>
                      <td class="px-4 py-3 text-right text-sm font-bold">{{ formatCurrency(summary().totalBilled) }}</td>
                      <td class="px-4 py-3 text-right text-sm font-bold text-emerald-700">{{ formatCurrency(summary().totalPaid) }}</td>
                    </tr>
                    <tr>
                      <td colspan="5" class="px-4 py-6 text-center">
                        <div class="inline-block border-2 border-slate-900 px-6 py-3 rounded-lg font-black text-xl bg-white shadow-sm">
                          SALDO A PAGAR: {{ formatCurrency(summary().currentDebt) }}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div class="mt-8 text-center text-[10px] uppercase font-bold text-slate-400 hidden print:block tracking-wider">
                Este documento es un estado de cuenta generado automáticamente.
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Charge Modal -->
      @if (showChargeModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 class="text-sm font-bold text-slate-900 tracking-tight">Registrar Venta</h3>
              <button (click)="closeChargeModal()" class="text-slate-400 hover:text-slate-700"><mat-icon class="text-sm">close</mat-icon></button>
            </div>
            <div class="p-6">
              @if (chargeErrorMessage()) {
                <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center">
                  <mat-icon class="mr-2 text-[18px]">error_outline</mat-icon>
                  {{ chargeErrorMessage() }}
                </div>
              }
              <form [formGroup]="saleForm" (ngSubmit)="onAddSale()">
                <div class="space-y-4">
                  <div>
                    <select formControlName="selectedSupply" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                      <option value="">-- Seleccionar Suministro --</option>
                      @for (sup of availableSupplies(); track sup.id) {
                        <option [value]="sup.id">{{ sup.name }} - {{ formatCurrency(sup.price) }}</option>
                      }
                    </select>
                  </div>
                  <div class="flex gap-4 items-end">
                    <div class="w-24">
                      <label for="quantity-input" class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cant.</label>
                      <input id="quantity-input" type="number" formControlName="quantity" min="1" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 outline-none">
                    </div>
                    <div class="flex-1">
                      <button type="button" (click)="addCartItem()" class="w-full bg-emerald-100 border border-emerald-200 hover:bg-emerald-200 text-emerald-800 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors">
                        Agregar Detalles
                      </button>
                    </div>
                  </div>

                  <!-- Cart Preview -->
                  @if (cart().length > 0) {
                    <div class="mt-6 border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm p-4 text-sm">
                      <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Detalle</h4>
                      <div class="space-y-2 mb-4">
                        @for (item of cart(); track $index) {
                          <div class="flex justify-between items-center border-b border-slate-50 pb-2 group">
                            <div class="flex items-center gap-2">
                              <button type="button" (click)="removeCartItem($index)" class="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-rose-50" title="Quitar detalle">
                                <mat-icon class="text-[16px] w-[16px] h-[16px]">remove_circle</mat-icon>
                              </button>
                              <span class="text-slate-600 italic font-medium">{{ item.quantity }}x {{ getSupplyName(item.supplyId) }}</span>
                            </div>
                            <span class="font-bold text-slate-900">{{ formatCurrency(item.unitPrice * item.quantity) }}</span>
                          </div>
                        }
                      </div>
                      <div class="pt-2 flex justify-between items-center">
                        <span class="font-bold text-slate-800 text-xs uppercase">Subtotal:</span>
                        <span class="text-lg font-black text-indigo-700">{{ formatCurrency(cartTotal()) }}</span>
                      </div>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-slate-100">
                      <label for="expectedPaymentAmount" class="block text-sm font-medium text-slate-700 mb-1">Abono Esperado (Opcional)</label>
                      <input id="expectedPaymentAmount" type="number" formControlName="expectedPaymentAmount" min="1" class="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                      <p class="text-xs text-slate-500 mt-1">Configure cuánto se espera que abone el cliente por esta venta.</p>
                    </div>

                    <div class="mt-4">
                      <label for="saleNotes" class="block text-sm font-medium text-slate-700 mb-1">Comentario (Opcional)</label>
                      <textarea id="saleNotes" formControlName="notes" rows="2" class="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Escribe un comentario o nota..."></textarea>
                    </div>
                  }
                  
                </div>
                <div class="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" (click)="closeChargeModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-bold uppercase tracking-wider transition-colors">Cancelar</button>
                  <button type="submit" [disabled]="cart().length === 0" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">Confirmar Cargo</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div class="px-6 py-4 border-b border-emerald-100 flex justify-between items-center bg-emerald-50">
              <h3 class="text-sm font-bold text-emerald-900 tracking-tight">Registrar Abono</h3>
              <button (click)="closePaymentModal()" class="text-emerald-700 hover:text-emerald-900"><mat-icon class="text-sm">close</mat-icon></button>
            </div>
            <div class="p-6">
              <div class="mb-6 text-center">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Deuda Pendiente</p>
                <p class="text-3xl font-black text-slate-900">{{ formatCurrency(summary().currentDebt) }}</p>
                @if (summary().suggestedPayment > 0) {
                  <p class="mt-2 inline-flex items-center space-x-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">payments</mat-icon>
                     <span>Abono Sugerido: {{ formatCurrency(summary().suggestedPayment) }}</span>
                  </p>
                }
              </div>
              <form [formGroup]="paymentForm" (ngSubmit)="onAddPayment()">
                <div>
                  <label for="paymentAmount" class="block text-xs font-bold text-slate-700 mb-1">Cantidad a Abonar</label>
                  <div class="relative">
                    <span class="absolute left-4 top-2.5 text-slate-500 font-bold">$</span>
                    <input id="paymentAmount" type="number" formControlName="amount" min="1" step="0.01" placeholder="Ej. 100"
                      class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-bold text-slate-900">
                  </div>
                  @if (summary().suggestedPayment > 0) {
                     <p class="text-xs text-slate-500 mt-2 text-center">
                       Se recomiendan pagos en línea con el abono sugerido.
                     </p>
                  }
                </div>
                
                <div class="mt-4">
                  <label for="paymentNotes" class="block text-xs font-bold text-slate-700 mb-1">Comentario (Opcional)</label>
                  <textarea id="paymentNotes" formControlName="notes" rows="2" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all" placeholder="Escribe un comentario o nota..."></textarea>
                </div>
                <div class="mt-8">
                  <button type="submit" [disabled]="paymentForm.invalid" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50">Ingresar Abono</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

    } @else {
      <div class="flex flex-col items-center justify-center p-12 text-center h-full">
        <mat-icon class="text-5xl text-slate-300 mb-4">search_off</mat-icon>
        <h2 class="text-xl font-bold text-slate-800 tracking-tight">Cliente no encontrado</h2>
        <a routerLink="/clients" class="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md text-sm">Volver al directorio</a>
      </div>
    }
  `
})
export class ClientDetailComponent {
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);

  clientId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  client = computed(() => this.dataService.clients().find(c => c.id === this.clientId()));
  supplies = this.dataService.supplies;
  
  // Computed summary
  _rawSummary = computed(() => this.dataService.getClientSummary(this.clientId())());
  summary = computed(() => this._rawSummary() || { totalBilled: 0, totalPaid: 0, currentDebt: 0, sales: [], payments: [] });

  // Ordered Ledger
  sortedLedger = computed(() => {
    const data = this.summary();
    const records: { id: string, date: string, type: string, amount: number, timestamp: number, runningBalance?: number, details?: SaleItem[], expectedPaymentAmount?: number }[] = [
      ...data.sales.map(s => ({ ...s, type: 'SALE', amount: s.total, timestamp: new Date(s.date).getTime(), details: s.items, expectedPaymentAmount: s.expectedPaymentAmount })),
      ...data.payments.map(p => ({ ...p, type: 'PAYMENT', amount: p.amount, timestamp: new Date(p.date).getTime() }))
    ];
    
    // Sort oldest first to calculate running balance
    records.sort((a, b) => a.timestamp - b.timestamp);
    
    let runningBalance = 0;
    records.forEach(r => {
      if (r.type === 'SALE') runningBalance += r.amount;
      if (r.type === 'PAYMENT') runningBalance -= r.amount;
      r.runningBalance = runningBalance;
    });

    // Reverse to show newest first
    return records.reverse();
  });

  // UI State
  showChargeModal = signal(false);
  showPaymentModal = signal(false);
  chargeErrorMessage = signal('');
  
  availableSupplies = computed(() => this.supplies().filter(s => s.stock > 0));

  // Shopping Cart inside modal
  cart = signal<SaleItem[]>([]);
  cartTotal = computed(() => this.cart().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0));

  // Forms
  saleForm = this.fb.group({
    selectedSupply: [''],
    quantity: [1, [Validators.required, Validators.min(1)]],
    expectedPaymentAmount: [null as number | null, [Validators.min(1)]],
    notes: ['']
  });

  paymentForm = this.fb.group({
    amount: ['', [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  // Helpers
  formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  }

  formatCurrentDate() {
    return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  getSupplyName(id: string) {
    return this.supplies().find(s => s.id === id)?.name || 'Suministro Desconocido';
  }

  async exportToExcel() {
    const data = this.sortedLedger();
    const chronological = [...data].reverse();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estado de Cuenta');

    // Header Row
    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 25 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Cliente', key: 'cliente', width: 25 },
      { header: 'Concepto', key: 'concepto', width: 40 },
      { header: 'Cargos', key: 'cargos', width: 15 },
      { header: 'Abonos', key: 'abonos', width: 15 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0B4C80' } // Dark blue
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' } // White
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
    });

    const clientName = this.client()?.name || 'Cliente';

    // Add Data
    chronological.forEach((row, index) => {
      let detalle = '';
      if (row.type === 'SALE' && row.details) {
        detalle = row.details.map(d => `${d.quantity}x ${this.getSupplyName(d.supplyId)}`).join(', ');
      } else {
        detalle = 'Abono a cuenta';
      }
      
      const newRow = worksheet.addRow({
        fecha: this.formatDate(row.date),
        tipo: row.type === 'SALE' ? 'Cargo (Venta)' : 'Abono',
        cliente: clientName,
        concepto: detalle,
        cargos: row.type === 'SALE' ? row.amount : null,
        abonos: row.type === 'PAYMENT' ? row.amount : null
      });

      // Format cargo as red color
      if (row.type === 'SALE') {
        const cargosCell = newRow.getCell('cargos');
        cargosCell.font = { color: { argb: 'FFD90000' } };
        cargosCell.numFmt = '#,##0.00';
      }

      // Format abono as green color
      if (row.type === 'PAYMENT') {
        const abonosCell = newRow.getCell('abonos');
        abonosCell.font = { color: { argb: 'FF008000' } };
        abonosCell.numFmt = '#,##0.00';
      }
      
      // Alternate background colors (light gray)
      if (index % 2 === 0) {
        newRow.eachCell((cell) => {
          if (!cell.fill) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFEAEAEA' }
            };
          }
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, `Estado_Cuenta_${clientName}.xlsx`);
  }

  // Charge Actions
  openChargeModal() {
    this.cart.set([]);
    this.saleForm.reset({ quantity: 1, selectedSupply: '' });
    this.showChargeModal.set(true);
  }

  closeChargeModal() {
    this.showChargeModal.set(false);
  }

  addCartItem() {
    this.chargeErrorMessage.set('');
    const supplyId = this.saleForm.value.selectedSupply;
    const qty = this.saleForm.value.quantity;
    if (!supplyId || !qty || qty < 1) return;

    const supply = this.supplies().find(s => s.id === supplyId);
    if (!supply) return;

    // Sum existing qty in cart for this item
    const existingItem = this.cart().find(c => c.supplyId === supplyId);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const totalQty = existingQty + qty;

    // Check if enough stock
    if (supply.stock < totalQty) {
      this.chargeErrorMessage.set(`Inventario insuficiente. Solo quedan ${supply.stock} unidades de ${supply.name}.`);
      return;
    }

    if (existingItem) {
      this.cart.update(c => c.map(item => item.supplyId === supplyId ? { ...item, quantity: totalQty } : item));
    } else {
      const item: SaleItem = { supplyId, quantity: qty, unitPrice: supply.price };
      this.cart.update(c => [...c, item]);
    }
    
    // reset selection but leave qty to 1
    this.saleForm.patchValue({ selectedSupply: '', quantity: 1 });
  }

  removeCartItem(index: number) {
    this.cart.update(c => {
      const newCart = [...c];
      newCart.splice(index, 1);
      return newCart;
    });
  }

  onAddSale() {
    if (this.cart().length > 0) {
      const expectedPayment = this.saleForm.value.expectedPaymentAmount;
      const notes = this.saleForm.value.notes;
      this.dataService.addSale({
        clientId: this.clientId(),
        items: this.cart(),
        ...(expectedPayment ? { expectedPaymentAmount: expectedPayment } : {}),
        ...(notes ? { notes } : {})
      });
      this.closeChargeModal();
    }
  }

  // Payment Actions
  openPaymentModal() {
    this.paymentForm.reset();
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
  }

  onAddPayment() {
    if (this.paymentForm.valid) {
      const notes = this.paymentForm.value.notes;
      this.dataService.addPayment({
        clientId: this.clientId(),
        amount: Number(this.paymentForm.value.amount),
        ...(notes ? { notes } : {})
      });
      this.closePaymentModal();
    }
  }
}
