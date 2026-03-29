import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'coloristia_secret_key';

router.post('/register', async (req, res) => {

  try {

    const { email, password, role } = req.body;
    const db = getDb();

    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'PREMIUM' ? 'PREMIUM' : 'REGISTERED';

    const result = db.prepare(
      'INSERT INTO User (email, password, role) VALUES (?, ?, ?)'
    ).run(email, hashedPassword, userRole);

    const userId = Number(result.lastInsertRowid);
    const token = jwt.sign({ userId, role: userRole }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: userId, email, role: userRole } });

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error al registrar usuario', detail: msg });

  }

});

router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM User WHERE email = ?').get(email) as any;

    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error al iniciar sesión', detail: msg });

  }

});

export default router;
