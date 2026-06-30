import { Router } from 'express';
import { db } from './db/db';
import * as schema from './db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const api = Router();

// Initialize default admin if no users exist
async function initAuth() {
  try {
    const usersCount = await db.select().from(schema.usuarios);
    if (usersCount.length === 0) {
      console.log('No users found. Creating default admin...');
      const adminProfileId = 'admin';
      await db.insert(schema.perfiles).values({
        id: adminProfileId,
        name: 'Administrador',
        permissions: ['clients', 'supplies', 'routes', 'financial', 'reports', 'users']
      }).onConflictDoNothing();

      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.insert(schema.usuarios).values({
        id: 'user_admin',
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador Principal',
        profileId: adminProfileId
      }).onConflictDoNothing();
      console.log('Default admin created.');
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  }
}
initAuth();

// Auth and Users
api.post('/login', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    const [user] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.username, username));
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    const [profile] = await db.select().from(schema.perfiles).where(eq(schema.perfiles.id, user.profileId));
    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.get('/profiles', async (req, res) => {
  try {
    const profiles = await db.select().from(schema.perfiles);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.post('/profiles', async (req, res) => {
  try {
    const [newProfile] = await db.insert(schema.perfiles).values(req.body).returning();
    res.json(newProfile);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.put('/profiles/:id', async (req, res) => {
  try {
    const [updatedProfile] = await db.update(schema.perfiles).set(req.body).where(eq(schema.perfiles.id, req.params.id)).returning();
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.delete('/profiles/:id', async (req, res) => {
  try {
    await db.delete(schema.perfiles).where(eq(schema.perfiles.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.get('/users', async (req, res) => {
  try {
    const users = await db.select().from(schema.usuarios);
    // don't send passwords
    const safeUsers = users.map(u => ({ id: u.id, username: u.username, name: u.name, profileId: u.profileId }));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.post('/users', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(schema.usuarios).values({ ...rest, password: hashedPassword }).returning();
    res.json({ id: newUser.id, username: newUser.username, name: newUser.name, profileId: newUser.profileId });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.put('/users/:id', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData: Record<string, unknown> = { ...rest };
    if (password) {
      updateData['password'] = await bcrypt.hash(password, 10);
    }
    const [updatedUser] = await db.update(schema.usuarios).set(updateData).where(eq(schema.usuarios.id, req.params.id)).returning();
    res.json({ id: updatedUser.id, username: updatedUser.username, name: updatedUser.name, profileId: updatedUser.profileId });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.delete('/users/:id', async (req, res) => {
  try {
    await db.delete(schema.usuarios).where(eq(schema.usuarios.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Clientes
api.get('/clients', async (req, res) => {
  try {
    const clients = await db.select().from(schema.clientes).orderBy(desc(schema.clientes.fechaCreacion));
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.post('/clients', async (req, res) => {
  try {
    const [newClient] = await db.insert(schema.clientes).values(req.body).returning();
    res.json(newClient);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.put('/clients/:id', async (req, res) => {
  try {
    const [updatedClient] = await db.update(schema.clientes).set(req.body).where(eq(schema.clientes.id, req.params.id)).returning();
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.delete('/clients/:id', async (req, res) => {
  try {
    await db.delete(schema.clientes).where(eq(schema.clientes.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Suministros
api.get('/supplies', async (req, res) => {
  try {
    const supplies = await db.select().from(schema.suministros).orderBy(schema.suministros.nombre);
    res.json(supplies);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.post('/supplies', async (req, res) => {
  try {
    const { historyType, notes, ...supplyData } = req.body;
    
    const [newSupply] = await db.insert(schema.suministros).values(supplyData).returning();
    
    if (historyType) {
      await db.insert(schema.historialSuministros).values({
        idSuministro: newSupply.id,
        nombreSuministro: newSupply.nombre,
        tipo: historyType,
        cantidadCambio: newSupply.stock,
        nuevoValorStock: newSupply.stock,
        notas: notes,
      });
    }

    res.json(newSupply);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.put('/supplies/:id', async (req, res) => {
  try {
    const { historyType, quantityChanged, notes, ...supplyData } = req.body;
    
    const [updatedSupply] = await db.update(schema.suministros).set(supplyData).where(eq(schema.suministros.id, req.params.id)).returning();
    
    if (historyType) {
      await db.insert(schema.historialSuministros).values({
        idSuministro: updatedSupply.id,
        nombreSuministro: updatedSupply.nombre,
        tipo: historyType,
        cantidadCambio: quantityChanged,
        nuevoValorStock: updatedSupply.stock,
        notas: notes,
      });
    }
    
    res.json(updatedSupply);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.delete('/supplies/:id', async (req, res) => {
  try {
    const [oldSupply] = await db.select().from(schema.suministros).where(eq(schema.suministros.id, req.params.id));
    if (oldSupply) {
      await db.insert(schema.historialSuministros).values({
        idSuministro: oldSupply.id,
        nombreSuministro: oldSupply.nombre,
        tipo: 'BAJA',
        notas: 'Insumo eliminado'
      });
    }
    await db.delete(schema.suministros).where(eq(schema.suministros.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.get('/supply-history', async (req, res) => {
  try {
    const history = await db.select().from(schema.historialSuministros).orderBy(desc(schema.historialSuministros.fecha));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Ventas
api.get('/sales', async (req, res) => {
  try {
    const sales = await db.select().from(schema.ventas).orderBy(desc(schema.ventas.fecha));
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.post('/sales', async (req, res) => {
  try {
    const { items, ...saleData } = req.body;
    
    const [newSale] = await db.insert(schema.ventas).values(saleData).returning();
    
    for (const item of items) {
      await db.insert(schema.detallesVentas).values({
        idVenta: newSale.id,
        idSuministro: item.idSuministro,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      });
      
      const [supply] = await db.select().from(schema.suministros).where(eq(schema.suministros.id, item.idSuministro));
      if (supply) {
          const newStock = supply.stock - item.cantidad;
          await db.update(schema.suministros).set({ stock: newStock }).where(eq(schema.suministros.id, supply.id));
          
          await db.insert(schema.historialSuministros).values({
            idSuministro: supply.id,
            nombreSuministro: supply.nombre,
            tipo: 'VENTA',
            cantidadCambio: -item.cantidad,
            nuevoValorStock: newStock,
            notas: `Venta ${newSale.id}`,
          });
      }
    }
    
    res.json(newSale);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Pagos
api.get('/payments', async (req, res) => {
  try {
    const payments = await db.select().from(schema.pagos).orderBy(desc(schema.pagos.fecha));
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.post('/payments', async (req, res) => {
  try {
    const [newPayment] = await db.insert(schema.pagos).values(req.body).returning();
    res.json(newPayment);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Visitas
api.get('/visits', async (req, res) => {
  try {
    const visits = await db.select().from(schema.visitas).orderBy(desc(schema.visitas.fecha));
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.post('/visits', async (req, res) => {
  try {
    const [newVisit] = await db.insert(schema.visitas).values(req.body).returning();
    res.json(newVisit);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

api.put('/visits/:id', async (req, res) => {
  try {
    const [updatedVisit] = await db.update(schema.visitas).set(req.body).where(eq(schema.visitas.id, req.params.id)).returning();
    res.json(updatedVisit);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export { api };
