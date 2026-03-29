import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'coloristia_secret_key';

// --- Middleware de autenticación ---
const authMiddleware = (req: any, res: any, next: any) => {

  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token is not valid' });
  }

};

// Guardar paleta
router.post('/', authMiddleware, (req: any, res: any) => {

  try {

    const { name, colors } = req.body;
    const userId = req.user.userId;

    const result = db().prepare(
      'INSERT INTO Palette (name, colors, userId) VALUES (?, ?, ?)'
    ).run(name, JSON.stringify(colors), userId);

    const palette = db().prepare('SELECT * FROM Palette WHERE id = ?').get(result.lastInsertRowid) as any;

    res.json({ ...palette, colors: JSON.parse(palette.colors) });

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error saving palette', detail: msg });

  }

});

// Obtener paletas del usuario
router.get('/', authMiddleware, (req: any, res: any) => {

  try {

    const palettes = db().prepare(
      'SELECT * FROM Palette WHERE userId = ? ORDER BY createdAt DESC'
    ).all(req.user.userId) as any[];

    res.json(palettes.map(p => ({ ...p, colors: JSON.parse(p.colors) })));

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error fetching palettes', detail: msg });

  }

});

// Eliminar paleta
router.delete('/:id', authMiddleware, (req: any, res: any) => {

  try {

    const id = Number(req.params.id);
    const userId = req.user.userId;

    const palette = db().prepare('SELECT id FROM Palette WHERE id = ? AND userId = ?').get(id, userId);

    if (!palette) {
      return res.status(404).json({ error: 'Palette not found or unauthorized' });
    }

    db().prepare('DELETE FROM Palette WHERE id = ?').run(id);
    res.json({ message: 'Palette deleted successfully' });

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error deleting palette', detail: msg });

  }

});

// Renombrar paleta
router.put('/:id', authMiddleware, (req: any, res: any) => {

  try {

    const id = Number(req.params.id);
    const { name } = req.body;
    const userId = req.user.userId;

    const palette = db().prepare('SELECT id FROM Palette WHERE id = ? AND userId = ?').get(id, userId);

    if (!palette) {
      return res.status(404).json({ error: 'Palette not found or unauthorized' });
    }

    db().prepare('UPDATE Palette SET name = ? WHERE id = ?').run(name, id);
    const updated = db().prepare('SELECT * FROM Palette WHERE id = ?').get(id) as any;

    res.json({ ...updated, colors: JSON.parse(updated.colors) });

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error updating palette', detail: msg });

  }

});

// Función auxiliar para no repetir getDb()
function db() {

  return getDb();

}

export default router;
