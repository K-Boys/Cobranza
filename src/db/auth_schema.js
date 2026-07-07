const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_zqIymWVN5D7R@ep-crimson-feather-atr8xdla-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function initAuth() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS perfiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT NOT NULL,
        correo TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        id_perfil UUID REFERENCES perfiles(id)
      );

      CREATE TABLE IF NOT EXISTS accesos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT UNIQUE NOT NULL,
        descripcion TEXT
      );

      CREATE TABLE IF NOT EXISTS perfiles_accesos (
        id_perfil UUID REFERENCES perfiles(id),
        id_acceso UUID REFERENCES accesos(id),
        PRIMARY KEY (id_perfil, id_acceso)
      );
    `);
    console.log("Auth tables created successfully");

    // Seed some initial data
    await pool.query(`
      INSERT INTO perfiles (nombre) VALUES ('Administrador') ON CONFLICT DO NOTHING;
      INSERT INTO perfiles (nombre) VALUES ('Usuario') ON CONFLICT DO NOTHING;
    `);

    // Assigning admin user
    const adminProfile = await pool.query(`SELECT id FROM perfiles WHERE nombre = 'Administrador'`);
    if (adminProfile.rows.length > 0) {
      await pool.query(`
        INSERT INTO usuarios (nombre, correo, password, id_perfil) 
        VALUES ('Admin', 'admin@example.com', 'admin123', $1) 
        ON CONFLICT (correo) DO NOTHING
      `, [adminProfile.rows[0].id]);
    }
    console.log("Initial data seeded");
  } catch (err) {
    console.error("Error creating auth tables", err);
  } finally {
    pool.end();
  }
}

initAuth();
