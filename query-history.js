const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_zqIymWVN5D7R@ep-crimson-feather-atr8xdla-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', ssl: { rejectUnauthorized: false }});
pool.query("SELECT tipo, notas FROM historial_suministros ORDER BY fecha DESC LIMIT 5").then(res => { console.log(res.rows); process.exit(0); });
