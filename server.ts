import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { initDatabase } from './server/db/connection.ts';
import authRoutes from './server/routes/authRoutes.ts';
import productRoutes from './server/routes/productRoutes.ts';
import inventoryRoutes from './server/routes/inventoryRoutes.ts';
import salesRoutes from './server/routes/salesRoutes.ts';
import reportRoutes from './server/routes/reportRoutes.ts';
import configRoutes from './server/routes/configRoutes.ts';
import customerRoutes from './server/routes/customerRoutes.ts';
import bannerRoutes from './server/routes/bannerRoutes.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp() {
  const app = express();

  // Basic Security & Parsing Middleware
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger for API calls
  app.use((req, _res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/customer', customerRoutes);
  app.use('/api/banners', bannerRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'RetailFlow Inventory & Sales Management',
      timestamp: new Date().toISOString()
    });
  });

  // Centralized Error Handler for API routes
  app.use('/api', errorHandler);

  return app;
}

export async function startServer() {
  const app = createExpressApp();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize Database / Datastore
  await initDatabase();

  // Frontend integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RetailFlow Server is running on http://0.0.0.0:${PORT}`);
  });

  return app;
}

// When executed directly (local dev or node start), start the server
const isDirectExecution = process.argv[1] && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js')
);

if (isDirectExecution && !process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal error starting RetailFlow server:', err);
    process.exit(1);
  });
}
