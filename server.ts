import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { config as loadDotenv } from 'dotenv';

// Garante que o .env seja carregado mesmo quando rodando fora do Vite
loadDotenv();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Additional backend APIs could go here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Node.js backend is running!' });
  });

  // Expõe configurações públicas para o frontend (lidas do process.env do servidor)
  app.get('/api/config', (req, res) => {
    res.json({
      googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || '',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
