import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'coloral_secret_key';

router.post('/register', async (req, res) => {

  try {
    const { email, password, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
    
      return res.status(400).json({ error: 'El usuario ya existe' });
      
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userRole = role === 'PREMIUM' ? 'PREMIUM' : 'REGISTERED';
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
      },
    });
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
  
    res.status(500).json({ error: 'Error al registrar usuario' });
    
  }
  
});

router.post('/login', async (req, res) => {

  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    
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
  
    res.status(500).json({ error: 'Error al iniciar sesión' });
    
  }
  
});

export default router;
