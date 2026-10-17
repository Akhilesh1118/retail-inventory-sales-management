import { createExpressApp } from '../server.ts';
import { initDatabase } from '../server/db/connection.ts';

const app = createExpressApp();

let initPromise: Promise<void> | null = null;

// Middleware to ensure database is initialized on serverless cold starts
app.use(async (_req, _res, next) => {
  if (!initPromise) {
    initPromise = initDatabase().catch((err) => {
      console.error('Failed to initialize database in Vercel handler:', err);
    });
  }
  try {
    await initPromise;
  } catch {
    // Graceful fallback already handled inside initDatabase
  }
  next();
});

export default app;
