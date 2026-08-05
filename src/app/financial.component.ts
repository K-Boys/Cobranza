import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from './data.service';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  id: string;
  type: 'PAYMENT' | 'SALE';
  date: string;
  clientId: string;
  notes: string;
  amount: number;
}

@Component({
  selector: 'app-financial',
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">Control Financiero</h2>
          <p class="text-sm text-slate-500 mt-1">Historial de abonos (ingresos) y cargos (ventas).</p>
        </div>
        <div class="flex flex-col md:flex-row flex-wrap gap-3 w-full lg:w-auto">
          <div class="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-2 sm:gap-0 sm:space-x-2">
            <input type="date" [ngModel]="startDate()" (ngModelChange)="startDate.set($event)" class="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50">
            <span class="text-slate-500 text-sm hidden sm:inline text-center">a</span>
            <input type="date" [ngModel]="endDate()" (ngModelChange)="endDate.set($event)" class="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50">
          </div>
          <div class="relative w-full md:w-auto flex-1">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</mat-icon>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Buscar cliente o nota..." class="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full bg-slate-50 transition-all">
          </div>
          <button (click)="exportToExcel()" class="w-full md:w-auto justify-center flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm whitespace-nowrap">
            <mat-icon class="text-[18px]">table_chart</mat-icon> <span>Exportar</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-emerald-600 rounded-xl p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div class="flex justify-between items-start mb-4 relative z-10">
            <h3 class="font-medium text-emerald-100">Total Abonos (Mes Actual)</h3>
            <div class="p-2 bg-emerald-500/50 rounded-lg"><mat-icon class="text-white text-[20px] w-[20px] h-[20px]">payments</mat-icon></div>
          </div>
          <div class="text-3xl font-bold tracking-tight relative z-10">{{ formatCurrency(totalMonthlyPayments()) }}</div>
        </div>
        
        <div class="bg-rose-600 rounded-xl p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div class="flex justify-between items-start mb-4 relative z-10">
            <h3 class="font-medium text-rose-100">Total Cargos (Mes Actual)</h3>
            <div class="p-2 bg-rose-500/50 rounded-lg"><mat-icon class="text-white text-[20px] w-[20px] h-[20px]">shopping_cart</mat-icon></div>
          </div>
          <div class="text-3xl font-bold tracking-tight relative z-10">{{ formatCurrency(totalMonthlySales()) }}</div>
        </div>

        <div class="bg-emerald border border-slate-200 rounded-xl p-6 text-slate-900 shadow-sm flex flex-col justify-between">
          <div class="flex justify-between items-start mb-4">
            <h3 class="font-medium text-slate-500">Balance General Activo</h3>
            <div class="p-2 bg-slate-100 rounded-lg"><mat-icon class="text-slate-400 text-[20px] w-[20px] h-[20px]">account_balance</mat-icon></div>
          </div>
          <div>
            <div class="text-3xl font-bold tracking-tight" [class.text-rose-600]="globalBalance() > 0" [class.text-emerald-600]="globalBalance() <= 0">
              {{ formatCurrency(globalBalance()) }}
            </div>
            <div class="text-xs text-slate-500 mt-1 font-medium">Deuda total de todos los clientes</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3">
            <h3 class="font-bold text-slate-800 tracking-tight text-sm">Historial General de Movimientos</h3>
            
            <div class="flex flex-wrap w-full sm:w-auto gap-2">
              <button (click)="filterType.set('ALL')" [class.bg-indigo-100]="filterType() === 'ALL'" [class.text-indigo-700]="filterType() === 'ALL'" class="flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Todos</button>
              <button (click)="filterType.set('PAYMENT')" [class.bg-emerald-100]="filterType() === 'PAYMENT'" [class.text-emerald-700]="filterType() === 'PAYMENT'" class="flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Abonos</button>
              <button (click)="filterType.set('SALE')" [class.bg-rose-100]="filterType() === 'SALE'" [class.text-rose-700]="filterType() === 'SALE'" class="flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cargos</button>
            </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse block md:table">
            <thead class="hidden md:table-header-group">
              <tr class="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th class="px-4 md:px-6 py-3 font-semibold w-48 whitespace-nowrap">Fecha y Hora</th>
                <th class="px-4 md:px-6 py-3 font-semibold whitespace-nowrap">Tipo</th>
                <th class="px-4 md:px-6 py-3 font-semibold whitespace-nowrap">Cliente</th>
                <th class="px-4 md:px-6 py-3 font-semibold min-w-[200px]">Detalles</th>
                <th class="px-4 md:px-6 py-3 font-semibold text-right whitespace-nowrap">Monto</th>
              </tr>
            </thead>
            <tbody class="flex flex-col md:table-row-group gap-3 md:gap-0 divide-y-0 md:divide-y divide-transparent md:divide-slate-100 text-sm bg-slate-50 md:bg-transparent p-3 md:p-0">
              @for (tx of filteredTransactions(); track tx.id) {
                <tr class="hover:bg-slate-50 md:hover:bg-slate-50 transition-colors flex flex-col md:table-row py-4 md:py-0 border border-slate-200 md:border-none md:border-b md:border-slate-100 relative bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none">
                  <td class="px-4 md:px-6 py-2 md:py-4 text-slate-500 text-xs font-medium block md:table-cell">
                    {{ formatDate(tx.date) }}
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap block md:table-cell">
                    @if (tx.type === 'PAYMENT') {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        Abono
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                        Cargo
                      </span>
                    }
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 block md:table-cell">
                    <div class="font-bold text-slate-900 truncate max-w-[200px]">{{ getClientName(tx.clientId) }}</div>
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 text-slate-500 text-xs italic block md:table-cell">
                    <div class="truncate max-w-[300px]">{{ tx.notes || '----' }}</div>
                  </td>
                  <td class="px-4 md:px-6 py-2 md:py-4 text-left md:text-right whitespace-nowrap block md:table-cell">
                    <span class="font-bold px-2.5 py-1 rounded-md" 
                          [class.text-emerald-600]="tx.type === 'PAYMENT'" [class.bg-emerald-50]="tx.type === 'PAYMENT'"
                          [class.text-rose-600]="tx.type === 'SALE'" [class.bg-rose-50]="tx.type === 'SALE'">
                      {{ tx.type === 'PAYMENT' ? '-' : '+' }} {{ formatCurrency(tx.amount) }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr class="block md:table-row">
                  <td colspan="5" class="px-4 md:px-6 py-16 text-center text-slate-500 bg-slate-50/50 block md:table-cell">
                    <div class="flex flex-col items-center justify-center">
                      <div class="p-4 bg-slate-100 rounded-full mb-3">
                        <mat-icon class="text-3xl text-slate-400" aria-hidden="true">receipt_long</mat-icon>
                      </div>
                      <p class="font-medium text-slate-700">No hay movimientos registrados</p>
                      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Intenta buscar con otros términos o registra nuevos abonos o cargos.
                      </p>
                    </div>
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
export class FinancialComponent {
  private dataService = inject(DataService);

  payments = this.dataService.payments;
  sales = this.dataService.sales;
  supplies = this.dataService.supplies;
  clients = this.dataService.clients;
  
  searchQuery = signal('');
  filterType = signal<'ALL' | 'PAYMENT' | 'SALE'>('ALL');
  startDate = signal<string>('');
  endDate = signal<string>('');

  allTransactions = computed<Transaction[]>(() => {
    const p = this.payments().map(payment => ({
      id: payment.id,
      type: 'PAYMENT' as const,
      date: payment.date,
      clientId: payment.clientId,
      notes: payment.notes || 'Abono a cuenta',
      amount: payment.amount
    }));

    const s = this.sales().map(sale => {
      const supplyNames = sale.items.map(item => {
        const supply = this.supplies().find(sup => sup.id === item.supplyId);
        return supply ? `${item.quantity}x ${supply.name}` : `${item.quantity}x Prod. Eliminado`;
      }).join(', ');
      
      return {
        id: sale.id,
        type: 'SALE' as const,
        date: sale.date,
        clientId: sale.clientId,
        notes: supplyNames,
        amount: sale.total
      };
    });

    return [...p, ...s].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  filteredTransactions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const type = this.filterType();
    const sDateStr = this.startDate();
    const eDateStr = this.endDate();
    
    let list = this.allTransactions();
    
    if (type !== 'ALL') {
      list = list.filter(tx => tx.type === type);
    }

    if (sDateStr) {
      const sDate = new Date(sDateStr);
      sDate.setHours(0, 0, 0, 0);
      list = list.filter(tx => new Date(tx.date) >= sDate);
    }

    if (eDateStr) {
      const eDate = new Date(eDateStr);
      eDate.setHours(23, 59, 59, 999);
      list = list.filter(tx => new Date(tx.date) <= eDate);
    }
    
    if (query) {
      list = list.filter(tx => {
        const clientName = this.getClientName(tx.clientId).toLowerCase();
        const notes = tx.notes.toLowerCase();
        return clientName.includes(query) || notes.includes(query);
      });
    }
    
    return list;
  });

  totalMonthlyPayments = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.payments().reduce((total, p) => {
      const paymentDate = new Date(p.date);
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        return total + p.amount;
      }
      return total;
    }, 0);
  });
  
  totalMonthlySales = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.sales().reduce((total, s) => {
      const saleDate = new Date(s.date);
      if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
        return total + s.total;
      }
      return total;
    }, 0);
  });
  
  globalBalance = computed(() => {
    const totalSales = this.sales().reduce((sum, s) => sum + s.total, 0);
    const totalPayments = this.payments().reduce((sum, p) => sum + p.amount, 0);
    return totalSales - totalPayments;
  });

  getClientName(clientId: string): string {
    const client = this.clients().find(c => c.id === clientId);
    return client ? client.name : 'Cliente Eliminado';
  }

  formatCurrency(value: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-MX', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr));
  }

  async exportToExcel() {
    const data = [...this.filteredTransactions()].reverse(); 
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Financiero', { views: [{ showGridLines: false }] });

    // Helper functions for Date
    const today = new Date();
    const todayStr = new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);
    
    const sDateFormatted = this.startDate() ? new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(this.startDate())) : 'Inicio';
    const eDateFormatted = this.endDate() ? new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(this.endDate())) : 'Fin';

    // Title rows
    const r1 = worksheet.addRow(['REPORTE FINANCIERO']);
    r1.font = { bold: true, size: 16 };
    
    worksheet.addRow(['INGRESOS', '', '', '', `Fecha de descarga: ${todayStr}`]);
    worksheet.addRow([`Fecha: ${sDateFormatted} - ${eDateFormatted}`]);

    // Format Column widths
    worksheet.getColumn('A').width = 25;
    worksheet.getColumn('B').width = 15;
    worksheet.getColumn('C').width = 25;
    worksheet.getColumn('D').width = 35;
    worksheet.getColumn('E').width = 15;
    worksheet.getColumn('F').width = 15;

    // Header Row
    const headerRow = worksheet.addRow(['Fecha', 'Tipo', 'Cliente', 'Concepto', 'Cargos', 'Abonos']);
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
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    let totalCargos = 0;
    let totalAbonos = 0;

    // Add Data
    data.forEach((row, index) => {
      const isSale = row.type === 'SALE';
      if (isSale) totalCargos += row.amount;
      else totalAbonos += row.amount;

      const newRow = worksheet.addRow([
        this.formatDate(row.date),
        isSale ? 'Cargo (Venta)' : 'Abono',
        this.getClientName(row.clientId),
        row.notes || 'Abono a cuenta',
        isSale ? row.amount : null,
        !isSale ? row.amount : null
      ]);

      // Alternating background
      const bgColor = index % 2 === 0 ? 'FFF2F2F2' : 'FFFFFFFF';
      
      newRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        
        if (colNumber === 5 && isSale) { // Cargos
           cell.font = { color: { argb: 'FFCC0000' } };
           cell.numFmt = '#,##0.00';
           cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 6 && !isSale) { // Abonos
           cell.font = { color: { argb: 'FF008000' } };
           cell.numFmt = '#,##0.00';
           cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Totals row
    const totalsRow = worksheet.addRow(['', '', '', 'Totales', totalCargos, totalAbonos]);
    totalsRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B4C80' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      if (colNumber >= 4) {
         cell.alignment = { horizontal: 'right' };
         if (colNumber === 5 || colNumber === 6) {
             cell.numFmt = '#,##0.00';
         }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, `Reporte_General_Financiero.xlsx`);
  }

  printPage() {
    const doc = new jsPDF();
    const data = [...this.filteredTransactions()].reverse();

    doc.setFontSize(16);
    doc.text('REPORTE FINANCIERO', 14, 15);
    
    doc.setFontSize(10);
    const todayStr = new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    doc.text(`Fecha de descarga: ${todayStr}`, 14, 22);

    const sDateFormatted = this.startDate() ? new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(this.startDate())) : 'Inicio';
    const eDateFormatted = this.endDate() ? new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(this.endDate())) : 'Fin';
    doc.text(`Fecha: ${sDateFormatted} - ${eDateFormatted}`, 14, 28);

    let totalCargos = 0;
    let totalAbonos = 0;

    const tableData = data.map(row => {
      const isSale = row.type === 'SALE';
      if (isSale) totalCargos += row.amount;
      else totalAbonos += row.amount;

      return [
        this.formatDate(row.date),
        isSale ? 'Cargo (Venta)' : 'Abono',
        this.getClientName(row.clientId),
        row.notes || 'Abono a cuenta',
        isSale ? '$' + row.amount.toFixed(2) : '',
        !isSale ? '$' + row.amount.toFixed(2) : ''
      ];
    });

    tableData.push([
        '', '', '', 'Totales', '$' + totalCargos.toFixed(2), '$' + totalAbonos.toFixed(2)
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Fecha', 'Tipo', 'Cliente', 'Concepto', 'Cargos', 'Abonos']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [11, 76, 128] }, // #0B4C80
      styles: { fontSize: 8 },
      didParseCell: function(data) {
        if (data.section === 'body') {
          // Check if it's the last row
          if (data.row.index === tableData.length - 1) {
             data.cell.styles.fillColor = [11, 76, 128]; // #0B4C80
             data.cell.styles.textColor = [255, 255, 255];
             data.cell.styles.fontStyle = 'bold';
             if (data.column.index >= 4) {
                 data.cell.styles.halign = 'right';
             }
          } else {
             // Red text for Cargos, Green text for Abonos
             if (data.column.index === 4 && data.cell.text[0] !== '') {
                 data.cell.styles.textColor = [204, 0, 0]; // #CC0000
                 data.cell.styles.halign = 'right';
             } else if (data.column.index === 5 && data.cell.text[0] !== '') {
                 data.cell.styles.textColor = [0, 128, 0]; // #008000
                 data.cell.styles.halign = 'right';
             }
          }
        }
      }
    });

    doc.save('Reporte_General_Financiero.pdf');
  }
}
