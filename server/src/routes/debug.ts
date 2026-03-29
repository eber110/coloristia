import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// --- Ruta de diagnóstico del servidor ---
router.get('/', (req, res) => {

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    sqlite_module: 'node:sqlite (nativo Node.js 22)',
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Definida' : '❌ NO definida',
      DATABASE_URL_value: process.env.DATABASE_URL || '(vacía)',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ Definida' : '❌ NO definida',
      PORT: process.env.PORT || '(no definido, usando 5000)',
      NODE_ENV: process.env.NODE_ENV || '(no definido)',
    },
    database: { status: 'pendiente' },
  };

  try {

    const db = getDb();
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM User').get() as any).count;

    results.database = {
      status: '✅ Conectado y operativo',
      users_count: userCount,
    };

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    results.database = { status: '❌ Error', detail: msg };

  }

  res.json(results);

});

export default router;
