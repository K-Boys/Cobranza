import { Injectable, signal, computed, effect } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Signals for state
  clients = signal<Client[]>([]);
  supplies = signal<Supply[]>([]);
  supplyHistory = signal<SupplyHistoryEvent[]>([]);
  sales = signal<Sale[]>([]);
  payments = signal<Payment[]>([]);
  visits = signal<Visit[]>([]);

  constructor() {
    this.loadInitialState();
    
    // Save to localStorage on change
    effect(() => {
      this.saveStateToLocalStorage();
    });
  }

  private loadInitialState() {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem('cobranza_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.clients.set(parsed.clients || []);
        this.supplies.set(parsed.supplies || []);
        this.supplyHistory.set(parsed.supplyHistory || []);
        this.sales.set(parsed.sales || []);
        this.payments.set(parsed.payments || []);
        this.visits.set(parsed.visits || []);
      }
    } catch(e) {
      console.error('Error loading state', e);
    }
  }

  private saveStateToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const state = {
        clients: this.clients(),
        supplies: this.supplies(),
        supplyHistory: this.supplyHistory(),
        sales: this.sales(),
        payments: this.payments(),
        visits: this.visits()
      };
      localStorage.setItem('cobranza_data', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state', e);
    }
  }

  // --- Clients ---
  addClient(client: Omit<Client, 'id' | 'createdAt'>) {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.clients.update(c => [...c, newClient]);
    return newClient;
  }

  updateClient(id: string, client: Partial<Client>) {
    this.clients.update(c => c.map(item => item.id === id ? { ...item, ...client } : item));
  }

  deleteClient(id: string) {
    this.clients.update(c => c.filter(item => item.id !== id));
  }

  // --- Supplies ---
  addSupplyHistory(event: Omit<SupplyHistoryEvent, 'id' | 'date'>) {
    const newEvent: SupplyHistoryEvent = {
      ...event,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    this.supplyHistory.update(h => [...h, newEvent]);
  }

  addSupply(supply: Omit<Supply, 'id'>) {
    const newSupply: Supply = {
      ...supply,
      id: crypto.randomUUID()
    };
    this.supplies.update(s => [...s, newSupply]);
    this.addSupplyHistory({
      supplyId: newSupply.id,
      supplyName: newSupply.name,
      type: 'ALTA',
      newStockValue: newSupply.stock,
      notes: `Insumo dado de alta con ${newSupply.stock} en stock`
    });
    return newSupply;
  }

  updateSupply(id: string, supply: Partial<Supply>) {
    const oldSupply = this.supplies().find(s => s.id === id);
    this.supplies.update(s => s.map(item => item.id === id ? { ...item, ...supply } : item));
    
    if (oldSupply) {
      if (supply.stock !== undefined && supply.stock !== oldSupply.stock) {
        const diff = supply.stock - oldSupply.stock;
        this.addSupplyHistory({
          supplyId: id,
          supplyName: supply.name || oldSupply.name,
          type: diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
          quantityChanged: Math.abs(diff),
          newStockValue: supply.stock,
          notes: `Stock modificado manualmente`
        });
      } else {
        this.addSupplyHistory({
          supplyId: id,
          supplyName: supply.name || oldSupply.name,
          type: 'EDICION',
          newStockValue: oldSupply.stock,
          notes: `Información de insumo actualizada`
        });
      }
    }
  }

  deleteSupply(id: string) {
    const oldSupply = this.supplies().find(s => s.id === id);
    this.supplies.update(s => s.filter(item => item.id !== id));
    if (oldSupply) {
      this.addSupplyHistory({
        supplyId: id,
        supplyName: oldSupply.name,
        type: 'BAJA',
        notes: `Insumo eliminado`
      });
    }
  }

  updateSupplyStock(id: string, newStock: number) {
    const oldSupply = this.supplies().find(s => s.id === id);
    this.supplies.update(s => s.map(sup => sup.id === id ? { ...sup, stock: newStock } : sup));

    if (oldSupply && oldSupply.stock !== newStock) {
      const diff = newStock - oldSupply.stock;
      this.addSupplyHistory({
        supplyId: id,
        supplyName: oldSupply.name,
        type: diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
        quantityChanged: Math.abs(diff),
        newStockValue: newStock,
        notes: `Ajuste de stock rápido`
      });
    }
  }

  adjustSupplyStock(id: string, diff: number, notes: string) {
    const oldSupply = this.supplies().find(s => s.id === id);
    if (!oldSupply || diff === 0) return;
    
    const newStock = Math.max(0, oldSupply.stock + diff);
    this.supplies.update(s => s.map(sup => sup.id === id ? { ...sup, stock: newStock } : sup));

    this.addSupplyHistory({
      supplyId: id,
      supplyName: oldSupply.name,
      type: diff > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
      quantityChanged: Math.abs(diff),
      newStockValue: newStock,
      notes: notes || (diff > 0 ? 'Stock agregado' : 'Stock descontado')
    });
  }

  // --- Sales (Adds debt) ---
  addSale(saleData: Omit<Sale, 'id' | 'date' | 'total'>) {
    let total = 0;
    
    // Deduct stock and calc total
    const currentSupplies = this.supplies();
    const updatedSupplies = [...currentSupplies];

    for (const item of saleData.items) {
      total += item.quantity * item.unitPrice;
      const supplyIdx = updatedSupplies.findIndex(s => s.id === item.supplyId);
      if (supplyIdx !== -1) {
        const newStock = updatedSupplies[supplyIdx].stock - item.quantity;
        
        this.addSupplyHistory({
          supplyId: updatedSupplies[supplyIdx].id,
          supplyName: updatedSupplies[supplyIdx].name,
          type: 'VENTA',
          quantityChanged: item.quantity,
          newStockValue: newStock,
          notes: `Venta a cliente`
        });

        updatedSupplies[supplyIdx] = { 
          ...updatedSupplies[supplyIdx], 
          stock: newStock 
        };
      }
    }

    this.supplies.set(updatedSupplies);

    const newSale: Sale = {
      ...saleData,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      total
    };
    this.sales.update(s => [...s, newSale]);
    return newSale;
  }

  // --- Payments (Reduces debt) ---
  addPayment(payment: Omit<Payment, 'id' | 'date'>) {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    this.payments.update(p => [...p, newPayment]);
    return newPayment;
  }

  // --- Visits ---
  addVisit(visit: Omit<Visit, 'id'>) {
    const newVisit: Visit = {
      ...visit,
      id: crypto.randomUUID()
    };
    this.visits.update(v => [...v, newVisit]);
    return newVisit;
  }

  updateVisit(id: string, visit: Partial<Visit>) {
    this.visits.update(v => v.map(item => item.id === id ? { ...item, ...visit } : item));
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
