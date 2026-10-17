import { Router, Response } from 'express';
import { db } from '../db/dataStore.ts';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// All inventory routes require authentication
router.use(authenticateToken);

// GET /api/inventory/low-stock - View products at or below reorder level
router.get('/low-stock', (_req, res) => {
  const lowStockProducts = db.getLowStockProducts();
  const outOfStockCount = lowStockProducts.filter((p) => p.availableStock === 0).length;
  const lowStockCount = lowStockProducts.filter((p) => p.availableStock > 0).length;

  res.json({
    summary: {
      totalAlerts: lowStockProducts.length,
      outOfStockCount,
      lowStockCount
    },
    products: lowStockProducts
  });
});

// POST /api/inventory/adjustments - Stock received or manual adjustment (Admin only)
router.post('/adjustments', requireAdmin, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { productId, adjustmentType, quantity, reason } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'BadRequest', message: 'productId is required.' });
      return;
    }

    if (!adjustmentType || !['STOCK_RECEIVED', 'MANUAL_INCREASE', 'MANUAL_DECREASE'].includes(adjustmentType)) {
      res.status(400).json({
        error: 'BadRequest',
        message: "adjustmentType must be 'STOCK_RECEIVED', 'MANUAL_INCREASE', or 'MANUAL_DECREASE'."
      });
      return;
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0 || !Number.isInteger(Number(quantity))) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'quantity must be a positive integer.'
      });
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      res.status(400).json({
        error: 'BadRequest',
        message: 'An audit reason is required for every inventory adjustment.'
      });
      return;
    }

    const { product, movement } = db.adjustInventory({
      productId,
      adjustmentType,
      quantity: Number(quantity),
      reason,
      user: {
        id: req.user!.userId,
        name: req.user!.fullName
      }
    });

    res.status(201).json({
      message: `Inventory adjusted successfully via ${adjustmentType}.`,
      product,
      movement
    });
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      res.status(404).json({ error: 'NotFound', message: err.message });
      return;
    }
    if (err.message && err.message.includes('Negative stock')) {
      res.status(400).json({ error: 'BadRequest', message: err.message });
      return;
    }
    next(err);
  }
});

// GET /api/inventory/movements - Audit trail of inventory movements
router.get('/movements', (req, res) => {
  const { productId, type, startDate, endDate, page, limit } = req.query;

  const result = db.getMovements({
    productId: productId ? String(productId) : undefined,
    type: type as any,
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50
  });

  res.json(result);
});

export default router;
