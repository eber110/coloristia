import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { isValidEmail, isValidPassword } from '../utils/validators.js';
import { generateVerificationToken, sendVerificationEmail } from '../utils/mailer.js';

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

    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'PREMIUM' ? 'PREMIUM' : 'REGISTERED';
    const verificationToken = generateVerificationToken();

    const result = db.prepare(
      'INSERT INTO User (email, password, role, isVerified, verificationToken) VALUES (?, ?, ?, ?, ?)'
    ).run(email, hashedPassword, userRole, 0, verificationToken);

    // Enviar el correo de verificación sin bloquear la respuesta
    sendVerificationEmail(email, verificationToken).catch(error => {
      console.error('Error al enviar correo de verificación:', error);
    });

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente. Por favor, revisa tu correo para verificar tu cuenta.',
      userId: Number(result.lastInsertRowid)
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

    const db = getDb();

    const user = db.prepare('SELECT id, verificationToken, isVerified FROM User WHERE email = ?').get(email) as any;

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: 'El correo electrónico ya ha sido verificado' });
    }

    if (user.verificationToken !== token) {
      return res.status(400).json({ error: 'Token de verificación incorrecto' });
    }

    db.prepare('UPDATE User SET isVerified = 1, verificationToken = NULL WHERE id = ?').run(user.id);

    res.status(200).json({ message: 'Correo electrónico verificado exitosamente. Ya puedes iniciar sesión.' });

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
