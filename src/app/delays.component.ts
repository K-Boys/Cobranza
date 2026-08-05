import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DataService, Client, Sale } from './data.service';

interface DelayedClient {
  client: Client;
  daysDelayed: number;
  totalDebt: number;
  oldestUnpaidDate: string;
}

@Component({
  selector: 'app-delays',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Cuentas por Cobrar</h2>
          <p class="text-slate-500 text-sm mt-1">Clientes con cargos vencidos según sus días de crédito</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap block md:table">
            <thead class="hidden md:table-header-group bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Cliente</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Deuda Total</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Días de Crédito</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Cargo más Antiguo Vencido</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Días de Retraso</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="flex flex-col md:table-row-group gap-3 md:gap-0 divide-y-0 md:divide-y divide-transparent md:divide-slate-100 bg-slate-50 md:bg-transparent p-3 md:p-0">
              @for (delay of delayedClients(); track delay.client.id) {
                <tr class="hover:bg-slate-50 transition-colors flex flex-col md:table-row py-4 md:py-0 border border-slate-200 md:border-none md:border-b md:border-slate-100 relative bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none">
                  <td class="px-4 md:px-6 py-2 md:py-4 block md:table-cell">
                    <div class="font-bold text-slate-900">{{ delay.client.name }}</div>
                    <div class="text-xs text-slate-500 flex items-center mt-1"><mat-icon class="text-[12px] mr-1">phone</mat-icon> {{ delay.client.phone || 'Sin teléfono' }}</div>
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 font-medium text-rose-600 block md:table-cell"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Deuda Total</div>
                    {{ formatCurrency(delay.totalDebt) }}
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 text-slate-600 block md:table-cell"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Días de Crédito</div>
                    {{ delay.client.paymentTermsDays ?? 15 }} días
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 text-slate-600 block md:table-cell"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Cargo más Antiguo Vencido</div>
                    {{ formatDate(delay.oldestUnpaidDate) }}
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 block md:table-cell">
                    <span class="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-full text-xs animate-pulse">
                      {{ delay.daysDelayed }} días de retraso
                    </span>
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 text-left md:text-right block md:table-cell">
                    <a [routerLink]="['/clients', delay.client.id]" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end">
                      Ver Estado de Cuenta <mat-icon class="ml-1 text-[16px]">chevron_right</mat-icon>
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr class="block md:table-row">
                  <td colspan="6" class="px-4 md:px-6 py-12 text-center text-slate-500 block md:table-cell">
                    <div class="flex justify-center mb-4">
                      <div class="bg-emerald-100 p-4 rounded-full">
                        <mat-icon class="text-4xl text-emerald-600">check_circle</mat-icon>
                      </div>
                    </div>
                    <h3 class="text-lg font-bold text-slate-700 mb-1">¡Todo al corriente!</h3>
                    <p>No hay clientes con atrasos en este momento.</p>
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
export class DelaysComponent {
  dataService = inject(DataService);

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  formatDate(dateStr: string) {
    if (!dateStr) return '--';
    return new Intl.DateTimeFormat('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(dateStr));
  }

  delayedClients = computed(() => {
    const clients = this.dataService.clients();
    const sales = this.dataService.sales();
    const payments = this.dataService.payments();
    const now = new Date();
    
    // Set time to end of day to give full grace period
    now.setHours(23, 59, 59, 999);

    const delayed: DelayedClient[] = [];

    clients.forEach(client => {
      const clientSales = sales.filter(s => s.clientId === client.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const clientPayments = payments.filter(p => p.clientId === client.id);

      const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalDebt = clientSales.reduce((sum, s) => sum + s.total, 0) - totalPaid;

      if (totalDebt > 0) {
        let currentPaid = totalPaid;
        let oldestUnpaidSale: Sale | null = null;
        
        for (const sale of clientSales) {
          if (currentPaid >= sale.total) {
            currentPaid -= sale.total;
          } else {
            oldestUnpaidSale = sale;
            break;
          }
        }

        if (oldestUnpaidSale) {
          const limitDays = client.paymentTermsDays ?? 7;
          const expectedPayment = oldestUnpaidSale.expectedPaymentAmount || oldestUnpaidSale.total;
          
          // Number of fully or partially paid periods
          const periodsPaid = currentPaid / expectedPayment;
          
          const saleDate = new Date(oldestUnpaidSale.date);
          const maxDueDate = new Date(saleDate);
          
          // First due date is saleDate + limitDays
          // Each paid period extends the due date by limitDays
          maxDueDate.setDate(maxDueDate.getDate() + limitDays + (periodsPaid * limitDays));
          
          if (now > maxDueDate) {
            // difference in time from maxDueDate to now
            const diffTime = Math.abs(now.getTime() - maxDueDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              delayed.push({
                client: client,
                daysDelayed: diffDays,
                totalDebt: totalDebt, 
                oldestUnpaidDate: oldestUnpaidSale.date
              });
            }
          }
        }
      }
    });

    return delayed.sort((a, b) => b.daysDelayed - a.daysDelayed);
  });
}
