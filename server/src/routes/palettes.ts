import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'coloristia_secret_key';

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

// Eliminar paleta
router.delete('/:id', authMiddleware, async (req: any, res: any) => {

  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const palette = await prisma.palette.findFirst({
      where: { id: Number(id), userId }
    });

    if (!palette) {
      return res.status(404).json({ error: 'Palette not found or unauthorized' });
    }

    await prisma.palette.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Palette deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting palette' });
  }
  
});

// Renombrar paleta
router.put('/:id', authMiddleware, async (req: any, res: any) => {

  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.userId;

    const palette = await prisma.palette.findFirst({
      where: { id: Number(id), userId }
    });

    if (!palette) {
      return res.status(404).json({ error: 'Palette not found or unauthorized' });
    }

    const updatedPalette = await prisma.palette.update({
      where: { id: Number(id) },
      data: { name }
    });

    res.json(updatedPalette);
  } catch (error) {
    res.status(500).json({ error: 'Error updating palette' });
  }
  
});

export default router;
