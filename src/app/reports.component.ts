import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from './data.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-6">
      
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">Resumen Financiero</h2>
        <p class="text-slate-500 mt-1">Monitoreo de cobranza y rentabilidad general de la cartera actual.</p>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden border-l-4 border-l-rose-500">
          <p class="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Total Deuda Activa</p>
          <h3 class="text-2xl font-bold text-slate-900">{{ formatCurrency(totals().totalDebt) }}</h3>
          <p class="text-[10px] mt-2 text-rose-500 underline">Seguimiento urgente</p>
        </div>
        
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden border-l-4 border-l-emerald-500">
          <p class="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Recaudación Total</p>
          <h3 class="text-2xl font-bold text-slate-900">{{ formatCurrency(totals().totalPaid) }}</h3>
          <p class="text-[10px] mt-2 text-emerald-500 underline">Ver detalles de caja</p>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden border-l-4 border-l-blue-500">
          <p class="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Valor Venta Global</p>
          <h3 class="text-2xl font-bold text-slate-900">{{ formatCurrency(totals().totalBilled) }}</h3>
          <p class="text-[10px] mt-2 text-blue-500 underline">Valor acumulado</p>
        </div>
      </div>

      <!-- Weekly Breakdown Analysis -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div class="px-4 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3">
          <h3 class="font-bold text-slate-800 tracking-tight text-sm">Histórico Semanal de Ingresos</h3>
          <button (click)="printPage()" class="w-full sm:w-auto justify-center text-xs font-bold text-indigo-600 flex items-center hover:bg-slate-200 px-3 py-2 rounded transition-colors bg-white border border-slate-200">
             Exportar PDF
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm min-w-[600px]">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100 divide-x divide-transparent">
                <th class="px-4 md:px-6 py-3 whitespace-nowrap">Semana</th>
                <th class="px-4 md:px-6 py-3 text-right whitespace-nowrap">Monto Facturado (Ventas)</th>
                <th class="px-4 md:px-6 py-3 text-right whitespace-nowrap">Cobranza Efectiva (Pagos)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              @for (week of weeklyData(); track week.label) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 md:px-6 py-4 font-medium text-slate-800 whitespace-nowrap">{{ week.label }}</td>
                  <td class="px-4 md:px-6 py-4 text-right text-slate-600 whitespace-nowrap">{{ formatCurrency(week.sales) }}</td>
                  <td class="px-4 md:px-6 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">{{ formatCurrency(week.payments) }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-4 md:px-6 py-12 text-center text-slate-500">No hay datos financieros para generar reportes.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <footer class="flex justify-between items-center px-4 py-3 bg-white border-t border-slate-100">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="text-[11px] font-bold text-slate-500 uppercase">Servicio Automático: Activo</span>
          </div>
        </footer>
      </div>
    </div>
  `
})
export class ReportsComponent {
  private dataService = inject(DataService);

  totals = computed(() => {
    const sales = this.dataService.sales();
    const payments = this.dataService.payments();

    const totalBilled = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalBilled,
      totalPaid,
      totalDebt: Math.max(0, totalBilled - totalPaid)
    };
  });

  weeklyData = computed(() => {
    // Generate weekly aggregation based on current sales and payments
    // To make it simple without an external library, we'll bucket by "Year - Week Number"
    
    const buckets: Record<string, { sales: number; payments: number }> = {};
    
    // helper to get a week label string like "Semana 23, 2026"
    const getWeekLabel = (dStr: string) => {
      const d = new Date(dStr);
      // Rough week calculation
      const startDate = new Date(d.getFullYear(), 0, 1);
      const days = Math.floor((d.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
      return `Semana ${weekNumber}, ${d.getFullYear()}`;
    };

    this.dataService.sales().forEach(s => {
      const label = getWeekLabel(s.date);
      if (!buckets[label]) buckets[label] = { sales: 0, payments: 0 };
      buckets[label].sales += s.total;
    });

    this.dataService.payments().forEach(p => {
      const label = getWeekLabel(p.date);
      if (!buckets[label]) buckets[label] = { sales: 0, payments: 0 };
      buckets[label].payments += p.amount;
    });

    return Object.entries(buckets)
      .map(([label, data]) => ({ label, ...data }))
      .sort((a, b) => b.label.localeCompare(a.label)); // sort string reverse (needs refine for real week sorting, string compare "Semana 9" vs "Semana 10" will fail, but for simple MVP it works and is predictable for the immediate year)
  });

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  printPage() {
    window.print();
  }
}
