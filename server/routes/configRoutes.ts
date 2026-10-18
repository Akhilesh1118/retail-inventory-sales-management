import { Router, Response } from 'express';
import { db } from '../db/dataStore.ts';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/config - Public store metadata (tax rate, currency, store name)
router.get('/', (_req, res) => {
  const config = db.getConfig();
  res.json({ config });
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
