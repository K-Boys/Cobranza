/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Client { 
  id: string; 
  name: string; 
  phone: string; 
  email: string; 
  street: string; 
  neighborhood: string; 
  city: string; 
  notes: string; 
  createdAt: string;
  paymentTermsDays?: number;
}
export interface Supply { id: string; name: string; price: number; stock: number; }
export interface SupplyHistoryEvent { 
  id: string; 
  supplyId: string; 
  supplyName: string;
  date: string; 
  type: 'ALTA' | 'BAJA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'VENTA' | 'EDICION'; 
  quantityChanged?: number; 
  newStockValue?: number; 
  notes?: string; 
}
export interface SaleItem { supplyId: string; quantity: number; unitPrice: number; }
export interface Sale { id: string; clientId: string; date: string; items: SaleItem[]; total: number; expectedPaymentAmount?: number; notes?: string; }
export interface Payment { id: string; clientId: string; date: string; amount: number; notes?: string; }
export interface Visit { id: string; clientId: string; date: string; status: 'pending' | 'visited' | 'not_found'; notes?: string; }

const mapClient = (c: any): Client => ({
  id: c.id, name: c.nombre, phone: c.telefono, email: c.correo, street: c.calle, 
  neighborhood: c.colonia, city: c.ciudad, notes: c.notas, paymentTermsDays: c.dias_termino_pago || c.diasTerminoPago, 
  createdAt: c.fecha_creacion || c.fechaCreacion
});

const mapClientReverse = (c: Partial<Client>): any => {
  const out: any = {};
  if (c.name !== undefined) out.nombre = c.name;
  if (c.phone !== undefined) out.telefono = c.phone;
  if (c.email !== undefined) out.correo = c.email;
  if (c.street !== undefined) out.calle = c.street;
  if (c.neighborhood !== undefined) out.colonia = c.neighborhood;
  if (c.city !== undefined) out.ciudad = c.city;
  if (c.notes !== undefined) out.notas = c.notes;
  if (c.paymentTermsDays !== undefined) out.diasTerminoPago = c.paymentTermsDays;
  return out;
};

const mapSupply = (s: any): Supply => ({
  id: s.id, name: s.nombre, price: Number(s.precio), stock: s.stock
});

const mapSupplyHistory = (h: any): SupplyHistoryEvent => ({
  id: h.id, supplyId: h.id_suministro || h.idSuministro, supplyName: h.nombre_suministro || h.nombreSuministro,
  date: h.fecha, type: h.tipo, quantityChanged: h.cantidad_cambio || h.cantidadCambio,
  newStockValue: h.nuevo_valor_stock || h.nuevoValorStock, notes: h.notas
});

const mapSale = (s: any): Sale => ({
  id: s.id, clientId: s.id_cliente || s.idCliente, date: s.fecha, items: s.items || [], 
  total: Number(s.total), expectedPaymentAmount: s.monto_pago_esperado || s.montoPagoEsperado ? Number(s.monto_pago_esperado || s.montoPagoEsperado) : undefined, 
  notes: s.notas
});

const mapPayment = (p: any): Payment => ({
  id: p.id, clientId: p.id_cliente || p.idCliente, date: p.fecha, amount: Number(p.monto), notes: p.notas
});

const mapVisit = (v: any): Visit => ({
  id: v.id, clientId: v.id_cliente || v.idCliente, date: v.fecha, status: v.estado, notes: v.notas
} as any);

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  clients = signal<Client[]>([]);
  supplies = signal<Supply[]>([]);
  supplyHistory = signal<SupplyHistoryEvent[]>([]);
  sales = signal<Sale[]>([]);
  payments = signal<Payment[]>([]);
  visits = signal<Visit[]>([]);

  constructor() {
    this.loadInitialState();
  }

  private loadInitialState() {
    if (typeof window === 'undefined') return;
    this.http.get<any[]>('/api/clients').subscribe(data => this.clients.set(data.map(mapClient)));
    this.http.get<any[]>('/api/supplies').subscribe(data => this.supplies.set(data.map(mapSupply)));
    this.http.get<any[]>('/api/supply-history').subscribe(data => this.supplyHistory.set(data.map(mapSupplyHistory)));
    this.http.get<any[]>('/api/sales').subscribe(data => this.sales.set(data.map(mapSale)));
    this.http.get<any[]>('/api/payments').subscribe(data => this.payments.set(data.map(mapPayment)));
    this.http.get<any[]>('/api/visits').subscribe(data => this.visits.set(data.map(mapVisit)));
  }

  // --- Clients ---
  addClient(client: Omit<Client, 'id' | 'createdAt'>) {
    this.http.post<any>('/api/clients', mapClientReverse(client)).subscribe(newClient => {
      this.clients.update(c => [mapClient(newClient), ...c]);
    });
    return {} as Client; 
  }

  updateClient(id: string, client: Partial<Client>) {
    this.http.put<any>(`/api/clients/${id}`, mapClientReverse(client)).subscribe(updatedClient => {
      this.clients.update(c => c.map(item => item.id === id ? mapClient(updatedClient) : item));
    });
  }

  deleteClient(id: string) {
    this.http.delete(`/api/clients/${id}`).subscribe(() => {
      this.clients.update(c => c.filter(item => item.id !== id));
    });
  }

  // --- Supplies ---
  addSupply(supply: Omit<Supply, 'id'>) {
    const payload = { nombre: supply.name, precio: supply.price, stock: supply.stock, historyType: 'ALTA', notes: `Insumo dado de alta con ${supply.stock} en stock` };
    this.http.post<any>('/api/supplies', payload).subscribe(newSupply => {
      this.supplies.update(s => [...s, mapSupply(newSupply)]);
      this.refreshSupplyHistory();
    });
    return {} as Supply;
  }

  updateSupply(id: string, supply: Partial<Supply>) {
    const oldSupply = this.supplies().find(s => s.id === id);
    const payload: any = {};
    if (supply.name !== undefined) payload.nombre = supply.name;
    if (supply.price !== undefined) payload.precio = supply.price;
    if (supply.stock !== undefined) payload.stock = supply.stock;

    if (oldSupply) {
      if (supply.stock !== undefined && supply.stock !== oldSupply.stock) {
        const diff = supply.stock - oldSupply.stock;
        payload.historyType = diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';
        payload.quantityChanged = Math.abs(diff);
        payload.notes = 'Stock modificado manualmente';
      } else {
        payload.historyType = 'EDICION';
        payload.notes = 'Información de insumo actualizada';
      }
    }

    this.http.put<any>(`/api/supplies/${id}`, payload).subscribe(updatedSupply => {
      this.supplies.update(s => s.map(item => item.id === id ? mapSupply(updatedSupply) : item));
      this.refreshSupplyHistory();
    });
  }

  deleteSupply(id: string) {
    this.http.delete(`/api/supplies/${id}`).subscribe(() => {
      this.supplies.update(s => s.filter(item => item.id !== id));
      this.refreshSupplyHistory();
    });
  }

  updateSupplyStock(id: string, newStock: number) {
    this.updateSupply(id, { stock: newStock });
  }

  adjustSupplyStock(id: string, diff: number, notes: string) {
    const oldSupply = this.supplies().find(s => s.id === id);
    if (!oldSupply || diff === 0) return;
    
    const newStock = Math.max(0, oldSupply.stock + diff);
    const payload = {
      stock: newStock,
      historyType: diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
      quantityChanged: Math.abs(diff),
      notes: notes || (diff > 0 ? 'Stock agregado' : 'Stock descontado')
    };

    this.http.put<any>(`/api/supplies/${id}`, payload).subscribe(updatedSupply => {
      this.supplies.update(s => s.map(item => item.id === id ? mapSupply(updatedSupply) : item));
      this.refreshSupplyHistory();
    });
  }

  private refreshSupplyHistory() {
    this.http.get<any[]>('/api/supply-history').subscribe(data => this.supplyHistory.set(data.map(mapSupplyHistory)));
  }

  // --- Sales ---
  addSale(saleData: Omit<Sale, 'id' | 'date' | 'total'>) {
    let total = 0;
    const itemsPayload = [];
    
    for (const item of saleData.items) {
      total += item.quantity * item.unitPrice;
      itemsPayload.push({
        idSuministro: item.supplyId,
        cantidad: item.quantity,
        precioUnitario: item.unitPrice
      });
    }

    const payload = {
      idCliente: saleData.clientId,
      total,
      montoPagoEsperado: saleData.expectedPaymentAmount,
      notas: saleData.notes,
      items: itemsPayload
    };

    this.http.post<any>('/api/sales', payload).subscribe(newSale => {
      this.sales.update(s => [mapSale(newSale), ...s]);
      this.http.get<any[]>('/api/supplies').subscribe(data => this.supplies.set(data.map(mapSupply)));
      this.refreshSupplyHistory();
    });
    return {} as Sale;
  }

  // --- Payments ---
  addPayment(payment: Omit<Payment, 'id' | 'date'>) {
    const payload = {
      idCliente: payment.clientId,
      monto: payment.amount,
      notas: payment.notes
    };
    this.http.post<any>('/api/payments', payload).subscribe(newPayment => {
      this.payments.update(p => [mapPayment(newPayment), ...p]);
    });
    return {} as Payment;
  }

  // --- Visits ---
  addVisit(visit: Omit<Visit, 'id'>) {
    const payload = {
      idCliente: visit.clientId,
      estado: visit.status,
      notas: visit.notes
    };
    this.http.post<any>('/api/visits', payload).subscribe(newVisit => {
      this.visits.update(v => [mapVisit(newVisit), ...v]);
    });
    return {} as Visit;
  }

  updateVisit(id: string, visit: Partial<Visit>) {
    const payload: any = {};
    if (visit.status !== undefined) payload.estado = visit.status;
    if (visit.notes !== undefined) payload.notas = visit.notes;

    this.http.put<any>(`/api/visits/${id}`, payload).subscribe(updatedVisit => {
      this.visits.update(v => v.map(item => item.id === id ? mapVisit(updatedVisit) : item));
    });
  }

  // --- Computed Views ---
  getClientSummary(clientId: string) {
    return computed(() => {
      const clientSales = this.sales().filter(s => s.clientId === clientId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const clientPayments = this.payments().filter(p => p.clientId === clientId);
      const totalBilled = clientSales.reduce((sum, s) => sum + s.total, 0);
      const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      const currentDebt = totalBilled - totalPaid;

      let suggestedPayment = 0;
      if (currentDebt > 0) {
        let remainingPaid = totalPaid;
        for (const sale of clientSales) {
          if (remainingPaid >= sale.total) {
            remainingPaid -= sale.total;
          } else {
            const saleRemainingDebt = sale.total - remainingPaid;
            remainingPaid = 0;
            if (sale.expectedPaymentAmount) {
              suggestedPayment += Math.min(sale.expectedPaymentAmount, saleRemainingDebt);
            }
          }
        }
      }

      return {
        totalBilled,
        totalPaid,
        currentDebt,
        suggestedPayment,
        sales: clientSales,
        payments: clientPayments
      };
    });
  }
}
