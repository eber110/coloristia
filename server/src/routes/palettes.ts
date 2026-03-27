import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'coloral_secret_key';

// Middleware simple de auth
const authMiddleware = (req: any, res: any, next: any) => {

  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
  
    return res.status(401).json({ error: 'No token, authorization denied' });
    
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
  
    res.status(401).json({ error: 'Token is not valid' });
    
  }
  
};

router.post('/', authMiddleware, async (req: any, res: any) => {

  try {
    const { name, colors } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Validación por roles controlada en el frontend por ahora
    const palette = await prisma.palette.create({
      data: {
        name,
        colors: JSON.stringify(colors),
        userId,
      },
    });
    
    res.json(palette);
  } catch (error) {
  
    res.status(500).json({ error: 'Error saving palette' });
    
  }
  
});

router.get('/', authMiddleware, async (req: any, res: any) => {

  try {
    const palettes = await prisma.palette.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    
    const parsedPalettes = palettes.map(p => ({
      ...p,
      colors: JSON.parse(p.colors)
    }));
    
    res.json(parsedPalettes);
  } catch (error) {
  
    res.status(500).json({ error: 'Error fetching palettes' });
    
  }
  
});

export default router;
