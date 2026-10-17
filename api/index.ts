import { createExpressApp } from '../server.ts';
import { initDatabase } from '../server/db/connection.ts';

let isReady = false;
const app = createExpressApp();

export default async function handler(req: any, res: any) {
  if (!isReady) {
    try {
      await initDatabase();
      isReady = true;
    } catch (err) {
      console.error('Failed to initialize database in Vercel handler:', err);
    }
  }
  return app(req, res);
}
