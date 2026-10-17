import { Router } from 'express';
import { db } from '../db/dataStore.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

// All report routes require authentication
router.use(authenticateToken);

// GET /api/reports/sales
router.get('/sales', (req, res) => {
  const { startDate, endDate } = req.query;
  const report = db.getSalesReport(
    startDate ? String(startDate) : undefined,
    endDate ? String(endDate) : undefined
  );
  res.json(report);
});

// GET /api/reports/profit
router.get('/profit', (req, res) => {
  const { startDate, endDate } = req.query;
  const report = db.getProfitReport(
    startDate ? String(startDate) : undefined,
    endDate ? String(endDate) : undefined
  );
  res.json(report);
});

// GET /api/reports/export/sales.csv - Bonus: Download CSV of sales report
router.get('/export/sales.csv', (req, res) => {
  const { startDate, endDate } = req.query;
  const salesResult = db.getSales({
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
    limit: 10000
  });

  const headers = [
    'Invoice Number',
    'Date',
    'Cashier',
    'Items Count',
    'Subtotal',
    'Discount',
    'Tax',
    'Total Amount',
    'Status',
    'Payment Method'
  ];

  const rows = salesResult.sales.map((s) => [
    `"${s.invoiceNumber}"`,
    `"${s.createdAt.slice(0, 19).replace('T', ' ')}"`,
    `"${s.userName.replace(/"/g, '""')}"`,
    s.items.reduce((sum, it) => sum + it.quantity, 0),
    s.subtotal.toFixed(2),
    s.discountAmount.toFixed(2),
    s.taxAmount.toFixed(2),
    s.totalAmount.toFixed(2),
    `"${s.status}"`,
    `"${s.paymentMethod}"`
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
  res.status(200).send(csv);
});

// GET /api/reports/export/inventory.csv - Bonus: Download CSV of inventory valuation
router.get('/export/inventory.csv', (_req, res) => {
  const products = db.getProducts({ limit: 10000 }).products;

  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Purchase Cost (Unit)',
    'Selling Price (Unit)',
    'Available Stock',
    'Unit',
    'Reorder Level',
    'Inventory Value (Cost)',
    'Potential Value (Retail)',
    'Status'
  ];

  const rows = products.map((p) => [
    `"${p.sku}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.category.replace(/"/g, '""')}"`,
    p.purchasePrice.toFixed(2),
    p.sellingPrice.toFixed(2),
    p.availableStock,
    `"${p.unit || 'pcs'}"`,
    p.reorderLevel,
    (p.purchasePrice * p.availableStock).toFixed(2),
    (p.sellingPrice * p.availableStock).toFixed(2),
    p.isActive ? '"Active"' : '"Deactivated"'
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory_valuation.csv"');
  res.status(200).send(csv);
});

export default router;
