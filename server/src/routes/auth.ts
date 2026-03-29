import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { isValidEmail, isValidPassword } from '../utils/validators.js';
import { generateVerificationToken, sendVerificationEmail } from '../utils/mailer.js';

interface PendingRegistration {
  email: string;
  hashedPassword: string;
  role: string;
  verificationToken: string;
  expiresAt: number;
}

const pendingRegistrations = new Map<string, PendingRegistration>();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'coloristia_secret_key';

router.post('/register', async (req, res) => {

  try {

    const { email, password, role } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Formato de correo electrónico inválido' });
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const db = getDb();
    const now = Date.now();

    // 1. Limpiar registros expirados
    for (const [key, data] of pendingRegistrations.entries()) {
      if (now > data.expiresAt) {
        pendingRegistrations.delete(key);
      }
    }

    // 2. Revisar si el correo ya existe en la BD confirmada
    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya se encuentra registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'PREMIUM' ? 'PREMIUM' : 'REGISTERED';
    const verificationToken = generateVerificationToken();
    const expiresAt = now + 3 * 60 * 1000; // 3 minutos

    // Guardar en la caché en memoria (No en la BD)
    pendingRegistrations.set(email, {
      email,
      hashedPassword,
      role: userRole,
      verificationToken,
      expiresAt
    });

    // Enviar el correo de verificación sin bloquear la respuesta
    sendVerificationEmail(email, verificationToken).catch(error => {
      console.error('Error al enviar correo de verificación:', error);
    });

    res.status(201).json({ 
      message: 'Usuario guardado temporalmente. Por favor, revisa tu correo e introduce el código antes de 3 minutos para verificar tu cuenta.'
    });

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error al registrar usuario', detail: msg });

  }

});

router.post('/verify-email', async (req, res) => {

  try {

    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'El correo y el token son requeridos' });
    }

    const pendingData = pendingRegistrations.get(email);

    if (!pendingData) {
      return res.status(404).json({ error: 'No hay registro pendiente para este correo o el tiempo expiró (3 min). Intenta registrarte nuevamente.' });
    }

    if (Date.now() > pendingData.expiresAt) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ error: 'El código de verificación expiró. Intenta registrarte nuevamente.' });
    }

    if (pendingData.verificationToken !== token) {
      return res.status(400).json({ error: 'Token de verificación incorrecto' });
    }

    const db = getDb();
    
    // Verificamos por seguridad que no exista en DB
    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
    if (!existingUser) {
    
      // Traspasar estado temporal a estado persistente (SQLite)
      const result = db.prepare(
        'INSERT INTO User (email, password, role, isVerified) VALUES (?, ?, ?, ?)'
      ).run(pendingData.email, pendingData.hashedPassword, pendingData.role, 1);
      
      const newUserId = Number(result.lastInsertRowid);
      const authToken = jwt.sign({ userId: newUserId, role: pendingData.role }, JWT_SECRET, { expiresIn: '7d' });

      // Limpiamos la caché inmediatamente
      pendingRegistrations.delete(email);

      return res.status(200).json({ 
        message: 'Correo electrónico verificado exitosamente. Iniciando sesión...',
        token: authToken,
        user: { id: newUserId, email: pendingData.email, role: pendingData.role }
      });
      
    } else {
    
      pendingRegistrations.delete(email);
      return res.status(400).json({ error: 'Este correo ya pertenece a un usuario validado.' });
      
    }

  } catch (error) {

    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error al verificar el correo', detail: msg });

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

    if (user.isVerified === 0) {
      return res.status(403).json({ error: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.' });
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
