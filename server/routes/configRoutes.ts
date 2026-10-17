import { Router, Response } from 'express';
import { db } from '../db/dataStore.ts';
import { getMongoStatus, runMongoDataOperationTest } from '../db/connection.ts';
import { pushLocalDataToMongo } from '../../scripts/pushDataToMongo.ts';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/config - Public store metadata (tax rate, currency, store name)
router.get('/', (_req, res) => {
  const config = db.getConfig();
  res.json({ config });
});

// GET /api/config/db-status - Check database connectivity and status
router.get('/db-status', async (_req, res) => {
  try {
    const status = await getMongoStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve database status',
      message: err.message
    });
  }
});

// POST /api/config/db-test - Run live CRUD test data operation on MongoDB
router.post('/db-test', async (_req, res) => {
  try {
    const result = await runMongoDataOperationTest();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'MongoDB test data operation failed',
      message: err.message
    });
  }
});

// POST /api/config/push-to-mongo - Push all local data into MongoDB Atlas
router.post('/push-to-mongo', async (_req, res) => {
  try {
    const result = await pushLocalDataToMongo();
    res.json({
      success: true,
      message: 'All local data pushed to MongoDB Atlas successfully.',
      summary: result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to push data to MongoDB Atlas',
      message: err.message
    });
  }
});

// PUT /api/config - Update store fiscal configuration (Admin only)
router.put('/', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { storeName, storeAddress, gstin, currency, taxRatePercent, defaultDiscountPercent } = req.body;

  const updated = db.updateConfig({
    ...(storeName !== undefined ? { storeName } : {}),
    ...(storeAddress !== undefined ? { storeAddress } : {}),
    ...(gstin !== undefined ? { gstin } : {}),
    ...(currency !== undefined ? { currency } : {}),
    ...(taxRatePercent !== undefined ? { taxRatePercent: Number(taxRatePercent) } : {}),
    ...(defaultDiscountPercent !== undefined ? { defaultDiscountPercent: Number(defaultDiscountPercent) } : {})
  });

  res.json({
    message: 'Store configuration updated successfully.',
    config: updated
  });
});

export default router;
