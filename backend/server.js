require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(express.json({ limit: '10kb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));

const INTERESES = ['vinas', 'gastronomia', 'naturaleza', 'cultura', 'familia', 'ciclismo'];
const RANGOS = ['bebes', 'preadolescentes', 'adolescentes'];

app.post('/api/visitantes', async (req, res) => {
  const b = req.body || {};
  const nombre = String(b.nombre || '').trim().slice(0, 120);
  const correo = String(b.correo || '').trim().slice(0, 160);
  const origen = String(b.origen || '').trim().slice(0, 120) || null;
  const edad = b.edad === '' || b.edad == null ? null : parseInt(b.edad, 10);
  const conAcomp = b.acompanantes === 'si';
  const total = conAcomp ? parseInt(b.total, 10) : 1;
  const menores = conAcomp ? (parseInt(b.menores, 10) || 0) : 0;
  const rangos = conAcomp && Array.isArray(b.rangosMenores) ? b.rangosMenores : [];
  const intereses = Array.isArray(b.intereses) ? b.intereses : [];

  const valido =
    nombre &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) &&
    (edad === null || (edad >= 1 && edad <= 120)) &&
    total >= 1 && total <= 50 && menores >= 0 && menores < total &&
    intereses.length > 0 && intereses.every(i => INTERESES.includes(i)) &&
    rangos.every(r => RANGOS.includes(r));

  if (!valido) return res.status(400).json({ error: 'Datos inválidos' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO visitante
        (nombre, edad, origen, correo, viaja_acompanado, total_personas, menores, rangos_menores, newsletter)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [nombre, edad, origen, correo, conAcomp, total, menores, rangos, !!b.newsletter]
    );
    await client.query(
      `INSERT INTO visitante_interes (visitante_id, interes_id)
       SELECT $1, id FROM interes WHERE codigo = ANY($2)`,
      [rows[0].id, intereses]
    );
    await client.query('COMMIT');
    res.status(201).json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

app.get('/api/estadisticas', async (req, res) => {
  try {
    const [resumen, porInteres, porOrigen, porRangoMenores] = await Promise.all([
      // 1. KPIs generales
      pool.query(`
        SELECT
          COUNT(*)::int AS total_registros,
          COALESCE(SUM(total_personas), 0)::int AS total_personas,
          COALESCE(SUM(menores), 0)::int AS total_menores,
          ROUND(AVG(edad), 1)::float AS edad_promedio,
          COUNT(*) FILTER (WHERE viaja_acompanado)::int AS viajan_acompanados,
          COUNT(*) FILTER (WHERE newsletter)::int AS suscritos_newsletter
        FROM visitante
      `),

      // 2. Conteo por interés (para gráfico de barras o torta)
      pool.query(`
        SELECT i.codigo, COUNT(vi.visitante_id)::int AS cantidad
        FROM interes i
        LEFT JOIN visitante_interes vi ON i.id = vi.interes_id
        GROUP BY i.codigo
        ORDER BY cantidad DESC
      `),

      // 3. Top 10 lugares de origen
      pool.query(`
        SELECT COALESCE(NULLIF(TRIM(origen), ''), 'No especificado') AS origen,
               COUNT(*)::int AS cantidad
        FROM visitante
        GROUP BY 1
        ORDER BY cantidad DESC
        LIMIT 10
      `),

      // 4. Desglose de rangos de menores (desarma el array de PostgreSQL)
      pool.query(`
        SELECT unnest(rangos_menores) AS rango, COUNT(*)::int AS cantidad
        FROM visitante
        WHERE array_length(rangos_menores, 1) > 0
        GROUP BY rango
        ORDER BY cantidad DESC
      `)
    ]);

    res.json({
      resumen: resumen.rows[0],
      por_interes: porInteres.rows,
      por_origen: porOrigen.rows,
      por_rango_menores: porRangoMenores.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});
app.listen(3000, () => console.log('API en http://localhost:3000'));