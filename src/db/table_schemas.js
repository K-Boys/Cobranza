const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_zqIymWVN5D7R@ep-crimson-feather-atr8xdla-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  const tables = [
    'clientes', 'suministros', 'historial_suministros', 'ventas', 'detalles_ventas', 'pagos', 'visitas'
  ];
  for (const table of tables) {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
    console.log(`Table: ${table}`);
    console.log(res.rows);
  }
  pool.end();
}
run();
