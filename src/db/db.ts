import { Pool } from 'pg';

const connectionString = process.env['DATABASE_URL'] || 'postgresql://neondb_owner:npg_zqIymWVN5D7R@ep-crimson-feather-atr8xdla-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function checkConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() as time');
    console.log('Successfully connected to the database at:', res.rows[0].time);
  } catch (err) {
    console.error('Failed to connect to the database', err);
  } finally {
    client.release();
  }
}
