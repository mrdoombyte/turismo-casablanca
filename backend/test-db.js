require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error al conectar:', err);
  } else {
    console.log('¡Conexión exitosa! Hora en Neon:', res.rows[0].now);
  }
  pool.end();
});