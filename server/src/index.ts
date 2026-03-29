import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import paletteRoutes from './routes/palettes.js';
import debugRoutes from './routes/debug.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Rutas base
app.use('/api/auth', authRoutes);
app.use('/api/palettes', paletteRoutes);
app.use('/api/debug', debugRoutes);

// Servidor ejecutandose
app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);
  
});
