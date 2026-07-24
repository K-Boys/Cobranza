const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_zqIymWVN5D7R@ep-crimson-feather-atr8xdla-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});
pool.query("ALTER TABLE clientes ADD COLUMN estatus text DEFAULT 'activo'").then(res => {
  console.log('Added estatus column');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
