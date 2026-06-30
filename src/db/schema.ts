import { pgTable, text, timestamp, integer, decimal, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const perfiles = pgTable('perfiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  permissions: text('permissions').array().notNull(),
});

export const usuarios = pgTable('usuarios', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  profileId: text('profile_id').references(() => perfiles.id).notNull(),
});

export const clientes = pgTable('clientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono').notNull(),
  correo: text('correo').notNull(),
  calle: text('calle').notNull(),
  colonia: text('colonia').notNull(),
  ciudad: text('ciudad').notNull(),
  notas: text('notas'),
  diasTerminoPago: integer('dias_termino_pago'),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
});

export const suministros = pgTable('suministros', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  precio: decimal('precio', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull().default(0),
});

export const tipoHistorialSuministroEnum = pgEnum('tipo_historial_suministro', ['ALTA', 'BAJA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'VENTA', 'EDICION']);

export const historialSuministros = pgTable('historial_suministros', {
  id: uuid('id').primaryKey().defaultRandom(),
  idSuministro: uuid('id_suministro').references(() => suministros.id).notNull(),
  nombreSuministro: text('nombre_suministro').notNull(),
  fecha: timestamp('fecha').defaultNow().notNull(),
  tipo: tipoHistorialSuministroEnum('tipo').notNull(),
  cantidadCambio: integer('cantidad_cambio'),
  nuevoValorStock: integer('nuevo_valor_stock'),
  notas: text('notas'),
});

export const ventas = pgTable('ventas', {
  id: uuid('id').primaryKey().defaultRandom(),
  idCliente: uuid('id_cliente').references(() => clientes.id).notNull(),
  fecha: timestamp('fecha').defaultNow().notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  montoPagoEsperado: decimal('monto_pago_esperado', { precision: 10, scale: 2 }),
  notas: text('notas'),
});

export const detallesVentas = pgTable('detalles_ventas', {
  id: uuid('id').primaryKey().defaultRandom(),
  idVenta: uuid('id_venta').references(() => ventas.id).notNull(),
  idSuministro: uuid('id_suministro').references(() => suministros.id).notNull(),
  cantidad: integer('cantidad').notNull(),
  precioUnitario: decimal('precio_unitario', { precision: 10, scale: 2 }).notNull(),
});

export const pagos = pgTable('pagos', {
  id: uuid('id').primaryKey().defaultRandom(),
  idCliente: uuid('id_cliente').references(() => clientes.id).notNull(),
  fecha: timestamp('fecha').defaultNow().notNull(),
  monto: decimal('monto', { precision: 10, scale: 2 }).notNull(),
  notas: text('notas'),
});

export const estadoVisitaEnum = pgEnum('estado_visita', ['pendiente', 'visitado', 'no_encontrado']);

export const visitas = pgTable('visitas', {
  id: uuid('id').primaryKey().defaultRandom(),
  idCliente: uuid('id_cliente').references(() => clientes.id).notNull(),
  fecha: timestamp('fecha').defaultNow().notNull(),
  estado: estadoVisitaEnum('estado').notNull().default('pendiente'),
  notas: text('notas'),
});
