import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { randomUUID } from 'node:crypto';
import { pool, checkConnection } from './db/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Connect to PostgreSQL database on startup
checkConnection();

app.get('/api/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    return res.json({ success: true, version: result.rows[0].version });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: message });
  }
});

app.use(express.json());

const JWT_SECRET = process.env['JWT_SECRET'] || 'cobranza-secret-key-123';

const authenticateToken = (req: any, res: any, next: any) => {
  // Allow these paths without token
  if (req.path === '/login' || req.path === '/db-test') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.use('/api', authenticateToken);

// Auth
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const profileRes = await pool.query('SELECT * FROM perfiles WHERE id = $1', [user.profile_id]);
    const profile = profileRes.rows[0];

    const token = jwt.sign({ id: user.id, username: user.username, profileId: user.profile_id }, JWT_SECRET, { expiresIn: '24h' });
    
    return res.json({ 
      token, 
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        profileId: user.profile_id,
        profile: {
          id: profile.id,
          name: profile.name,
          permissions: profile.permissions
        }
      } 
    });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/me', async (req: any, res) => {
  try {
    const result = await pool.query('SELECT id, username, name, profile_id FROM usuarios WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.sendStatus(404);
    
    const user = result.rows[0];
    const profileRes = await pool.query('SELECT * FROM perfiles WHERE id = $1', [user.profile_id]);
    const profile = profileRes.rows[0];

    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      profileId: user.profile_id,
      profile: {
        id: profile.id,
        name: profile.name,
        permissions: profile.permissions
      }
    });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM perfiles');
    return res.json(result.rows);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/profiles', async (req, res) => {
  try {
    const { id, name, permissions } = req.body;
    await pool.query('INSERT INTO perfiles (id, name, permissions) VALUES ($1, $2, $3)', [id || randomUUID(), name, permissions]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.put('/api/profiles/:id', async (req, res) => {
  try {
    const { name, permissions } = req.body;
    await pool.query('UPDATE perfiles SET name=$1, permissions=$2 WHERE id=$3', [name, permissions, req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/profiles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM perfiles WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, name, profile_id as "profileId" FROM usuarios');
    return res.json(result.rows);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, username, password, name, profileId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO usuarios (id, username, password, name, profile_id) VALUES ($1, $2, $3, $4, $5)', 
      [id || randomUUID(), username, hashedPassword, name, profileId]
    );
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, password, name, profileId } = req.body;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE usuarios SET username=$1, password=$2, name=$3, profile_id=$4 WHERE id=$5', 
        [username, hashedPassword, name, profileId, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET username=$1, name=$2, profile_id=$3 WHERE id=$4', 
        [username, name, profileId, req.params.id]
      );
    }
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Clients
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        nombre as name, 
        telefono as phone, 
        correo as email, 
        calle as street, 
        colonia as neighborhood, 
        ciudad as city, 
        notas as notes, 
        fecha_creacion as "createdAt", 
        dias_termino_pago as "paymentTermsDays" 
      FROM clientes
    `);
    return res.json(result.rows);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { id, name, phone, email, street, neighborhood, city, notes, createdAt, paymentTermsDays } = req.body;
    await pool.query(
      'INSERT INTO clientes (id, nombre, telefono, correo, calle, colonia, ciudad, notas, fecha_creacion, dias_termino_pago) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, name, phone, email, street, neighborhood, city, notes, createdAt, paymentTermsDays]
    );
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { name, phone, email, street, neighborhood, city, notes, paymentTermsDays } = req.body;
    await pool.query(
      'UPDATE clientes SET nombre=$1, telefono=$2, correo=$3, calle=$4, colonia=$5, ciudad=$6, notas=$7, dias_termino_pago=$8 WHERE id=$9',
      [name, phone, email, street, neighborhood, city, notes, paymentTermsDays, req.params.id]
    );
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clientes WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Supplies
app.get('/api/supplies', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre as name, precio::float as price, stock FROM suministros');
    return res.json(result.rows);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/supplies', async (req, res) => {
  try {
    const { id, name, price, stock } = req.body;
    await pool.query('INSERT INTO suministros (id, nombre, precio, stock) VALUES ($1, $2, $3, $4)', [id, name, price, stock]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.put('/api/supplies/:id', async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    await pool.query('UPDATE suministros SET nombre=$1, precio=$2, stock=$3 WHERE id=$4', [name, price, stock, req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/supplies/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suministros WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Supply History
app.get('/api/supply-history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        id_suministro as "supplyId", 
        nombre_suministro as "supplyName", 
        fecha as date, 
        tipo as type, 
        cantidad_cambio as "quantityChanged", 
        nuevo_valor_stock as "newStockValue", 
        notas 
      FROM historial_suministros 
      ORDER BY fecha DESC
    `);
    return res.json(result.rows);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/supply-history', async (req, res) => {
  try {
    const { id, supplyId, supplyName, date, type, quantityChanged, newStockValue, notes } = req.body;
    await pool.query(
      'INSERT INTO historial_suministros (id, id_suministro, nombre_suministro, fecha, tipo, cantidad_cambio, nuevo_valor_stock, notas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, supplyId, supplyName, date, type, quantityChanged, newStockValue, notes]
    );
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Sales
app.get('/api/sales', async (req, res) => {
  try {
    const salesResult = await pool.query(`
      SELECT 
        id, 
        id_cliente as "clientId", 
        fecha as date, 
        total::float, 
        monto_pago_esperado::float as "expectedPaymentAmount", 
        notas 
      FROM ventas 
      ORDER BY fecha DESC
    `);
    const itemsResult = await pool.query(`
      SELECT 
        id_venta, 
        id_suministro, 
        cantidad, 
        precio_unitario::float 
      FROM detalles_ventas
    `);
    
    const itemsBySale: Record<string, any[]> = {};
    for (const item of itemsResult.rows) {
      if (!itemsBySale[item.id_venta]) itemsBySale[item.id_venta] = [];
      itemsBySale[item.id_venta].push({
        supplyId: item.id_suministro,
        quantity: item.cantidad,
        unitPrice: item.precio_unitario
      });
    }

    const sales = salesResult.rows.map(s => ({
      ...s,
      items: itemsBySale[s.id] || []
    }));

    return res.json(sales);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/sales', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id, clientId, date, items, total, expectedPaymentAmount, notes } = req.body;
    await client.query(
      'INSERT INTO ventas (id, id_cliente, fecha, total, monto_pago_esperado, notas) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, clientId, date, total, expectedPaymentAmount, notes]
    );
    
    for (const item of items) {
      await client.query(
        'INSERT INTO detalles_ventas (id, id_venta, id_suministro, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), id, item.supplyId, item.quantity, item.unitPrice]
      );
    }
    
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (err: any) { 
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message }); 
  } finally {
    client.release();
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM detalles_ventas WHERE id_venta=$1', [req.params.id]);
    await client.query('DELETE FROM ventas WHERE id=$1', [req.params.id]);
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (err: any) { 
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message }); 
  } finally {
    client.release();
  }
});

// Payments
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, id_cliente as "clientId", fecha as date, monto::float as amount, notas FROM pagos ORDER BY fecha DESC');
    return res.json(result.rows);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { id, clientId, date, amount, notes } = req.body;
    await pool.query(
      'INSERT INTO pagos (id, id_cliente, fecha, monto, notas) VALUES ($1, $2, $3, $4, $5)',
      [id, clientId, date, amount, notes]
    );
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pagos WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Visits
app.get('/api/visits', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, id_cliente as "clientId", fecha as date, estado as status, notas FROM visitas ORDER BY fecha DESC');
    return res.json(result.rows);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/visits', async (req, res) => {
  try {
    const { id, clientId, date, status, notes } = req.body;
    await pool.query(
      'INSERT INTO visitas (id, id_cliente, fecha, estado, notas) VALUES ($1, $2, $3, $4, $5)',
      [id, clientId, date, status, notes]
    );
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.put('/api/visits/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    await pool.query('UPDATE visitas SET estado=$1, notas=$2 WHERE id=$3', [status, notes, req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/visits/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM visitas WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
