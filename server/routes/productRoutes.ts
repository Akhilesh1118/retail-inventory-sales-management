import { Router, Response } from 'express';
import multer from 'multer';
import { db } from '../db/dataStore.ts';
import {
  authenticateToken,
  optionalAuthenticateToken,
  requireAdmin,
  AuthenticatedRequest
} from '../middleware/auth.ts';
import {
  cloudinaryService,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
} from '../services/cloudinary.ts';
import { generateProductSvg } from '../services/productImageGenerator.ts';

const router = Router();
const INTERNAL_TEST_CATEGORY = 'testing';

function canViewInternalCatalog(req: AuthenticatedRequest): boolean {
  return req.user?.role === 'admin';
}

// Configure Multer for in-memory file buffering prior to Cloudinary streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

// GET /api/products/cloudinary-status - Safe status info (never exposes api secret)
router.get('/cloudinary-status', (_req, res) => {
  const all = db.getProducts({ limit: 5000 }).products;
  const missing = all.filter((p) => !p.imageUrl || p.imageUrl.trim() === '').length;
  res.json({
    isConfigured: cloudinaryService.isConfigured(),
    cloudName: cloudinaryService.getCloudName(),
    maxFileSizeMb: cloudinaryService.getMaxFileSizeMb(),
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    missingImagesCount: missing,
    totalProducts: all.length
  });
});

// GET /api/products/categories - Distinct categories (public)
router.get('/categories', optionalAuthenticateToken, (req: AuthenticatedRequest, res) => {
  const categories = db.getCategories().filter((category) =>
    canViewInternalCatalog(req) || category.toLowerCase() !== INTERNAL_TEST_CATEGORY
  );
  res.json({ categories });
});

// GET /api/products - List, search, filter, paginate, sort (public, cost price hidden for non-admin)
router.get('/', optionalAuthenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      category,
      stockStatus,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const result = db.getProducts({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      excludeCategories: canViewInternalCatalog(req) ? undefined : [INTERNAL_TEST_CATEGORY],
      stockStatus: stockStatus as any,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });

    // If user is not staff/admin, sanitize purchasePrice so customers never see cost prices
    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
    const sanitizedProducts = isPrivileged
      ? result.products
      : (result.products || []).map((p) => {
          const { purchasePrice: _cost, ...rest } = p;
          return { ...rest, purchasePrice: 0 };
        });

    res.json({
      ...result,
      products: sanitizedProducts
    });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(200).json({
      products: [],
      pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
      categories: []
    });
  }
});

// GET /api/products/:id - Single product details (public, cost price hidden for non-admin)
router.get('/:id', optionalAuthenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product || (product.category.toLowerCase() === INTERNAL_TEST_CATEGORY && !canViewInternalCatalog(req))) {
    res.status(404).json({ error: 'NotFound', message: `Product '${req.params.id}' not found.` });
    return;
  }

  const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
  const safeProduct = isPrivileged
    ? product
    : (() => {
        const { purchasePrice: _cost, ...rest } = product;
        return { ...rest, purchasePrice: 0 };
      })();

  res.json({ product: safeProduct });
});

// Admin-only modification routes require authentication
router.use(authenticateToken);

// POST /api/products - Create product (Admin only)
router.post('/', requireAdmin, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const {
      sku,
      name,
      category,
      purchasePrice,
      sellingPrice,
      availableStock,
      reorderLevel,
      description,
      unit,
      imageUrl,
      imagePublicId
    } = req.body;

    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
      res.status(400).json({ error: 'BadRequest', message: 'SKU is required and must be a non-empty string.' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'BadRequest', message: 'Product name is required.' });
      return;
    }

    if (purchasePrice === undefined || isNaN(Number(purchasePrice)) || Number(purchasePrice) < 0) {
      res.status(400).json({ error: 'BadRequest', message: 'Valid non-negative purchase price is required.' });
      return;
    }

    if (sellingPrice === undefined || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
      res.status(400).json({ error: 'BadRequest', message: 'Valid non-negative selling price is required.' });
      return;
    }

    const newProduct = db.createProduct(
      {
        sku,
        name,
        category: category || 'General',
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        availableStock: availableStock !== undefined ? Number(availableStock) : 0,
        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 10,
        description,
        unit,
        imageUrl,
        imagePublicId
      },
      {
        id: req.user!.userId,
        name: req.user!.fullName
      }
    );

    res.status(201).json({
      message: 'Product created successfully.',
      product: newProduct
    });
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      res.status(409).json({ error: 'Conflict', message: err.message });
      return;
    }
    next(err);
  }
});

// PUT /api/products/:id - Edit product (Admin only)
router.put('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      purchasePrice,
      sellingPrice,
      reorderLevel,
      description,
      unit,
      sku,
      imageUrl,
      imagePublicId
    } = req.body;

    const updated = db.updateProduct(id, {
      name,
      category,
      purchasePrice,
      sellingPrice,
      reorderLevel,
      description,
      unit,
      sku,
      imageUrl,
      imagePublicId
    });

    res.json({
      message: 'Product updated successfully.',
      product: updated
    });
  } catch (err: any) {
    if (err.message === 'Product not found.') {
      res.status(404).json({ error: 'NotFound', message: err.message });
      return;
    }
    if (err.message && err.message.includes('already in use')) {
      res.status(409).json({ error: 'Conflict', message: err.message });
      return;
    }
    next(err);
  }
});

// PATCH /api/products/:id/status - Deactivate or reactivate product (Admin only)
router.patch('/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'BadRequest', message: "'isActive' boolean is required in request body." });
      return;
    }

    const updated = db.setProductStatus(id, isActive);
    res.json({
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully.`,
      product: updated
    });
  } catch (err: any) {
    if (err.message === 'Product not found.') {
      res.status(404).json({ error: 'NotFound', message: err.message });
      return;
    }
    next(err);
  }
});

// POST /api/products/:id/image - Upload or Replace Product Image (Admin only)
router.post(
  '/:id/image',
  requireAdmin,
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const product = db.getProductById(id);

      if (!product) {
        res.status(404).json({ error: 'NotFound', message: `Product '${id}' not found.` });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'BadRequest', message: 'No image file was uploaded.' });
        return;
      }

      // Backend validation of file format and size
      const validation = cloudinaryService.validateFile(req.file);
      if (!validation.valid) {
        res.status(400).json({ error: 'BadRequest', message: validation.error });
        return;
      }

      // Remember old publicId for safe replacement cleanup
      const oldPublicId = product.imagePublicId;

      // Upload new image to Cloudinary
      const uploadResult = await cloudinaryService.upload(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Save new image URL and publicId to product in database
      const updatedProduct = db.setProductImage(id, uploadResult.url, uploadResult.publicId);

      // Requirement 8: Delete the old Cloudinary image only after the replacement upload and database update succeed
      if (oldPublicId && oldPublicId !== uploadResult.publicId) {
        try {
          await cloudinaryService.delete(oldPublicId);
        } catch (cleanupErr) {
          console.warn(`Failed to cleanup previous Cloudinary asset ${oldPublicId}:`, cleanupErr);
        }
      }

      res.status(200).json({
        message: 'Product image uploaded successfully.',
        imageUrl: uploadResult.url,
        imagePublicId: uploadResult.publicId,
        product: updatedProduct
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/products/:id/image - Remove Product Image (Admin only)
router.delete('/:id/image', requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const product = db.getProductById(id);

    if (!product) {
      res.status(404).json({ error: 'NotFound', message: `Product '${id}' not found.` });
      return;
    }

    if (!product.imagePublicId && !product.imageUrl) {
      res.status(400).json({ error: 'BadRequest', message: 'This product has no image to remove.' });
      return;
    }

    // Delete asset from Cloudinary
    if (product.imagePublicId) {
      await cloudinaryService.delete(product.imagePublicId);
    }

    // Safely update product record in database
    const updatedProduct = db.removeProductImage(id);

    res.status(200).json({
      message: 'Product image removed successfully.',
      product: updatedProduct
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/fill-missing-images - Bulk-generate & upload placeholder illustrations (Admin only)
router.post('/fill-missing-images', requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { force, limit } = req.body || {};
    const allProducts = db.getProducts({ limit: 1000 }).products;

    // Filter products without images (or all if force is true)
    const targetProducts = force
      ? allProducts
      : allProducts.filter((p) => !p.imageUrl || p.imageUrl.trim() === '');

    const productsToProcess = limit && Number(limit) > 0
      ? targetProducts.slice(0, Number(limit))
      : targetProducts;

    let updatedCount = 0;
    let failedCount = 0;
    const errors: Array<{ sku: string; name: string; error: string }> = [];
    const updatedProducts: Array<{ id: string; sku: string; name: string; imageUrl: string }> = [];

    for (const product of productsToProcess) {
      try {
        const svgString = generateProductSvg({
          name: product.name,
          category: product.category,
          sku: product.sku,
          sellingPrice: product.sellingPrice
        });

        const svgBuffer = Buffer.from(svgString, 'utf-8');
        const cleanSku = (product.sku || product._id).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `auto_${cleanSku}_${Date.now()}.svg`;

        const uploadResult = await cloudinaryService.upload(
          svgBuffer,
          filename,
          'image/svg+xml'
        );

        db.setProductImage(product._id, uploadResult.url, uploadResult.publicId);

        updatedCount++;
        updatedProducts.push({
          id: product._id,
          sku: product.sku,
          name: product.name,
          imageUrl: uploadResult.url
        });
      } catch (err: any) {
        failedCount++;
        errors.push({
          sku: product.sku,
          name: product.name,
          error: err.message || 'Unknown error'
        });
        console.warn(`[AutoImage] Failed to generate/upload image for product ${product.sku}:`, err.message);
      }
    }

    res.json({
      success: true,
      totalScanned: allProducts.length,
      missingCount: targetProducts.length,
      processed: productsToProcess.length,
      updated: updatedCount,
      failed: failedCount,
      skipped: allProducts.length - targetProducts.length,
      message: `Successfully generated and uploaded ${updatedCount} product illustrations to Cloudinary.`,
      updatedProducts,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/generate-image - Generate placeholder for single product (Admin only)
router.post('/:id/generate-image', requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const product = db.getProductById(id);
    if (!product) {
      res.status(404).json({ error: 'NotFound', message: `Product '${id}' not found.` });
      return;
    }

    const svgString = generateProductSvg({
      name: product.name,
      category: product.category,
      sku: product.sku,
      sellingPrice: product.sellingPrice
    });

    const svgBuffer = Buffer.from(svgString, 'utf-8');
    const cleanSku = (product.sku || product._id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `auto_${cleanSku}_${Date.now()}.svg`;

    const oldPublicId = product.imagePublicId;

    const uploadResult = await cloudinaryService.upload(
      svgBuffer,
      filename,
      'image/svg+xml'
    );

    const updated = db.setProductImage(product._id, uploadResult.url, uploadResult.publicId);

    if (oldPublicId && oldPublicId !== uploadResult.publicId) {
      try {
        await cloudinaryService.delete(oldPublicId);
      } catch (cleanupErr) {
        console.warn(`[AutoImage] Previous asset cleanup warning:`, cleanupErr);
      }
    }

    res.json({
      success: true,
      message: 'Product illustration generated and uploaded successfully.',
      imageUrl: uploadResult.url,
      product: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;
