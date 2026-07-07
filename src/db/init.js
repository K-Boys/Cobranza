const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_zqIymWVN5D7R@ep-crimson-feather-atr8xdla-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        email VARCHAR(255),
        street VARCHAR(255),
        neighborhood VARCHAR(255),
        city VARCHAR(255),
        notes TEXT,
        created_at VARCHAR(255),
        payment_terms_days INTEGER
      );

      CREATE TABLE IF NOT EXISTS supplies (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS supply_history (
        id VARCHAR(255) PRIMARY KEY,
        supply_id VARCHAR(255),
        supply_name VARCHAR(255),
        date VARCHAR(255),
        type VARCHAR(50),
        quantity_changed INTEGER,
        new_stock_value INTEGER,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(255) PRIMARY KEY,
        client_id VARCHAR(255),
        date VARCHAR(255),
        total REAL,
        expected_payment_amount REAL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        sale_id VARCHAR(255),
        supply_id VARCHAR(255),
        quantity INTEGER,
        unit_price REAL
      );

      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        client_id VARCHAR(255),
        date VARCHAR(255),
        amount REAL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS visits (
        id VARCHAR(255) PRIMARY KEY,
        client_id VARCHAR(255),
        date VARCHAR(255),
        status VARCHAR(50),
        notes TEXT
      );
    `);
    console.log("Tables created successfully");
  } catch (err) {
    console.error("Error creating tables", err);
  } finally {
    pool.end();
  }
}

initDb();
