import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService, Client, Sale } from './data.service';
import { FormsModule } from '@angular/forms';

interface RouteClient {
  client: Client;
  totalDebt: number;
  daysDelayed: number;
  visitStatus: 'pending' | 'visited' | 'not_found';
  visitId?: string;
  isDelayed: boolean;
}

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Rutas de Cobranza</h2>
          <p class="text-slate-500 text-sm mt-1">Visitas programadas a clientes con adeudos o atrasos.</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap block md:table">
            <thead class="hidden md:table-header-group bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Cliente / Dirección</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Deuda</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Estado de Cuenta</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700">Estado de Visita</th>
                <th class="px-4 md:px-6 py-4 font-semibold text-slate-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="flex flex-col md:table-row-group gap-3 md:gap-0 divide-y-0 md:divide-y divide-transparent md:divide-slate-100 bg-slate-50 md:bg-transparent p-3 md:p-0">
              @for (route of routeClients(); track route.client.id) {
                <tr class="hover:bg-slate-50 md:hover:bg-slate-50 transition-colors flex flex-col md:table-row py-4 md:py-0 border border-slate-200 md:border-none md:border-b md:border-slate-100 relative bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none" [class.bg-slate-50]="route.visitStatus !== 'pending'">
                  <td class="px-4 md:px-6 py-2 md:py-4 block md:table-cell">
                    <div class="font-bold text-slate-900">{{ route.client.name }}</div>
                    <div class="text-xs text-slate-500 mt-1 flex items-center">
                      <mat-icon class="text-[14px] mr-1 shrink-0">location_on</mat-icon>
                      <span class="truncate">{{ route.client.street }}, {{ route.client.neighborhood }}, {{ route.client.city }}</span>
                    </div>
                    @if (route.client.notes) {
                      <div class="text-[10px] text-slate-400 mt-0.5 ml-4 text-wrap max-w-xs whitespace-normal">{{ route.client.notes }}</div>
                    }
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 font-medium block md:table-cell" [ngClass]="route.totalDebt > 0 ? 'text-rose-600' : 'text-slate-700'"><div class="md:hidden text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Deuda</div>
                    {{ formatCurrency(route.totalDebt) }}
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 block md:table-cell">
                    @if (route.isDelayed) {
                      <span class="px-2 py-1 bg-rose-100 text-rose-700 font-bold rounded-md text-xs">
                        Retraso ({{ route.daysDelayed }} días)
                      </span>
                    } @else if (route.totalDebt > 0) {
                      <span class="px-2 py-1 bg-amber-100 text-amber-700 font-bold rounded-md text-xs">
                        Pendiente
                      </span>
                    }
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 block md:table-cell">
                    @if (route.visitStatus === 'pending') {
                      <span class="text-slate-500 font-medium flex items-center">
                        <mat-icon class="text-sm mr-1">schedule</mat-icon> Por visitar
                      </span>
                    } @else if (route.visitStatus === 'visited') {
                      <span class="text-emerald-600 font-bold flex items-center">
                        <mat-icon class="text-sm mr-1">check_circle</mat-icon> Visitado
                      </span>
                    } @else if (route.visitStatus === 'not_found') {
                      <span class="text-rose-600 font-bold flex items-center">
                        <mat-icon class="text-sm mr-1">cancel</mat-icon> No se encontró
                      </span>
                    }
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 text-left md:text-right block md:table-cell">
                    <div class="flex items-center justify-end space-x-2">
                      <button (click)="markVisit(route.client.id, route.visitId, 'visited')" 
                              [class.bg-emerald-100]="route.visitStatus === 'visited'"
                              [class.text-emerald-700]="route.visitStatus === 'visited'"
                              [class.bg-slate-100]="route.visitStatus !== 'visited'"
                              [class.text-slate-600]="route.visitStatus !== 'visited'"
                              class="p-2 rounded-lg hover:bg-emerald-200 transition-colors" title="Marcar como visitado">
                        <mat-icon class="text-[18px] w-[18px] h-[18px]">done</mat-icon>
                      </button>
                      <button (click)="markVisit(route.client.id, route.visitId, 'not_found')" 
                              [class.bg-rose-100]="route.visitStatus === 'not_found'"
                              [class.text-rose-700]="route.visitStatus === 'not_found'"
                              [class.bg-slate-100]="route.visitStatus !== 'not_found'"
                              [class.text-slate-600]="route.visitStatus !== 'not_found'"
                              class="p-2 rounded-lg hover:bg-rose-200 transition-colors" title="No se encontró a la persona">
                        <mat-icon class="text-[18px] w-[18px] h-[18px]">person_off</mat-icon>
                      </button>
                      <button (click)="markVisit(route.client.id, route.visitId, 'pending')" 
                              [class.bg-slate-100]="route.visitStatus === 'pending'"
                              [class.text-slate-600]="route.visitStatus === 'pending'"
                              class="p-2 rounded-lg hover:bg-slate-200 transition-colors" title="Restablecer">
                        <mat-icon class="text-[18px] w-[18px] h-[18px]">undo</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr class="block md:table-row">
                  <td colspan="5" class="px-4 md:px-6 py-12 text-center text-slate-500 block md:table-cell">
                    <mat-icon class="text-4xl text-slate-300 mb-2">map</mat-icon>
                    <h3 class="text-lg font-bold text-slate-700 mb-1">Sin rutas pendientes</h3>
                    <p>No hay clientes con adeudos o no se ha generado la lista.</p>
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
export class RoutesComponent {
  dataService = inject(DataService);

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  markVisit(clientId: string, visitId: string | undefined, status: 'pending' | 'visited' | 'not_found') {
    if (visitId) {
      this.dataService.updateVisit(visitId, { status });
    } else {
      if (status !== 'pending') {
         this.dataService.addVisit({
            clientId,
            date: new Date().toISOString(),
            status
         });
      }
    }
  }

  routeClients = computed(() => {
    const clients = this.dataService.clients();
    const sales = this.dataService.sales();
    const payments = this.dataService.payments();
    const visits = this.dataService.visits();
    const now = new Date();
    
    // Set time to end of day to give full grace period
    now.setHours(23, 59, 59, 999);
    
    const results: RouteClient[] = [];

    clients.forEach(client => {
      const clientSales = sales.filter(s => s.clientId === client.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const clientPayments = payments.filter(p => p.clientId === client.id);
      
      const clientVisits = visits.filter(v => v.clientId === client.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestVisit = clientVisits.length > 0 ? clientVisits[0] : null;

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

        let isDelayed = false;
        let diffDays = 0;

        if (oldestUnpaidSale) {
          const limitDays = client.paymentTermsDays ?? 15;
          const saleDate = new Date(oldestUnpaidSale.date);
          const maxDueDate = new Date(saleDate);
          maxDueDate.setDate(maxDueDate.getDate() + limitDays);
          
          if (now > maxDueDate) {
            const diffTime = Math.abs(now.getTime() - maxDueDate.getTime());
            diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) isDelayed = true;
          }
        }

        results.push({
          client,
          totalDebt,
          isDelayed,
          daysDelayed: diffDays,
          visitStatus: latestVisit ? latestVisit.status : 'pending',
          visitId: latestVisit ? latestVisit.id : undefined
        });
      }
    });

    return results.sort((a, b) => {
      // Pending first
      if (a.visitStatus === 'pending' && b.visitStatus !== 'pending') return -1;
      if (a.visitStatus !== 'pending' && b.visitStatus === 'pending') return 1;

      // Delayed first
      if (a.isDelayed && !b.isDelayed) return -1;
      if (!a.isDelayed && b.isDelayed) return 1;

      return b.daysDelayed - a.daysDelayed;
    });
  });
}
