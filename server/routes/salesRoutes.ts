import { Router, Response } from 'express';
import { db } from '../db/dataStore.ts';
import { authenticateToken, requireRole, requireStaffOrAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// POST /api/sales - Create sale with atomic stock deduction and authoritative pricing (Supports staff POS and online customer checkout)
router.post('/', authenticateToken, requireRole(['customer', 'staff', 'admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { items, discountPercent, paymentMethod, notes, customerName, customerPhone, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Sale must contain a non-empty array of items.'
      });
      return;
    }

    const effectiveName = req.user?.fullName || (customerName && customerName.trim() ? customerName.trim() : 'Store Customer');
    const effectiveEmail = customerEmail || (req.user?.email || null);

    const saleUser = req.user
      ? { id: req.user.userId, name: effectiveName }
      : {
          id: 'customer_portal',
          name: effectiveName
        };

    const saleNotes = [
      notes,
      customerPhone ? `Phone: ${customerPhone}` : null,
      effectiveEmail ? `Email: ${effectiveEmail}` : null,
      req.user?.role === 'customer' ? `Account: ${req.user.userId}` : null
    ]
      .filter(Boolean)
      .join(' | ');

    // Authoritative pricing: Manual discounts are ONLY permitted for authorized staff or admin at the POS register.
    // Storefront customers / online shoppers cannot set or manipulate discount percentages.
    const isStaffOrAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
    const effectiveDiscountPercent = isStaffOrAdmin && discountPercent !== undefined
      ? Number(discountPercent)
      : 0;

    const sale = await db.createSale({
      items,
      discountPercent: effectiveDiscountPercent,
      paymentMethod,
      notes: saleNotes,
      user: saleUser
    });

    res.status(201).json({
      message: 'Sale completed successfully.',
      sale
    });
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes('Insufficient stock') ||
        err.message.includes('deactivated') ||
        err.message.includes('Duplicate product') ||
        err.message.includes('Invalid quantity'))
    ) {
      res.status(400).json({ error: 'BadRequest', message: err.message });
      return;
    }
    if (err.message && err.message.includes('not found')) {
      res.status(404).json({ error: 'NotFound', message: err.message });
      return;
    }
    next(err);
  }
});

// GET /api/sales/:id - View single sale invoice / receipt (Accessible by invoice reference)
router.get('/:id', (req, res) => {
  const sale = db.getSaleById(req.params.id);
  if (!sale) {
    res.status(404).json({ error: 'NotFound', message: `Sale '${req.params.id}' not found.` });
    return;
  }
  res.json({ sale });
});

// All management listing and return routes require staff/admin authentication
router.use(authenticateToken, requireStaffOrAdmin);

// GET /api/sales - List sales with filters and pagination
router.get('/', (req, res) => {
  const { search, startDate, endDate, status, page, limit } = req.query;

  const result = db.getSales({
    search: search ? String(search) : undefined,
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
    status: status ? String(status) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50
  });

  res.json(result);
});

// POST /api/sales/:id/return - Return a completed sale and restock inventory
router.post('/:id/return', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      res.status(400).json({ error: 'BadRequest', message: 'A return reason is required.' });
      return;
    }

    const result = db.returnSale(id, reason, {
      id: req.user!.userId,
      name: req.user!.fullName
    });

    res.json({
      message: 'Sale returned successfully and stock restored.',
      sale: result.sale,
      returnedMovements: result.returnedMovements
    });
  } catch (err: any) {
    if (err.message === 'Sale not found.') {
      res.status(404).json({ error: 'NotFound', message: err.message });
      return;
    }
    if (err.message && err.message.includes('already been returned')) {
      res.status(400).json({ error: 'BadRequest', message: err.message });
      return;
    }
    next(err);
  }
});

export default router;
