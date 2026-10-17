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

const router = Router();

// Configure Multer for in-memory file buffering for banner uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

// GET /api/banners - List banners
// Public: returns active banners sorted by sortOrder
// If all=true and caller is authenticated admin/staff, returns all banners
router.get('/', optionalAuthenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const includeAll = req.query.all === 'true';
  const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
  
  const banners = db.getBanners(includeAll && isPrivileged);
  res.json({ banners });
});

// GET /api/banners/:id - Single banner details
router.get('/:id', (req, res) => {
  const banner = db.getBannerById(req.params.id);
  if (!banner) {
    res.status(404).json({ error: 'NotFound', message: `Banner '${req.params.id}' not found.` });
    return;
  }
  res.json({ banner });
});

// All modification routes require authentication and admin role
router.use(authenticateToken);

// POST /api/banners/reorder - Reorder banners (Admin only)
router.post('/reorder', requireAdmin, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'BadRequest', message: 'orderedIds must be an array of banner IDs.' });
      return;
    }

    const updatedBanners = db.reorderBanners(orderedIds);
    res.status(200).json({
      message: 'Banners reordered successfully.',
      banners: updatedBanners
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/banners/reset-defaults - Reset to 5 default starter banners (Admin only)
router.post('/reset-defaults', requireAdmin, (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const defaultBanners = db.resetDefaultBanners();
    res.status(200).json({
      message: 'Banners reset to default starter templates successfully.',
      banners: defaultBanners
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/banners - Create a new banner (Admin only)
router.post('/', requireAdmin, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const {
      mode,
      title,
      description,
      badgeText,
      badgeIcon,
      categoryKey,
      ctaText,
      ctaLink,
      imageUrl,
      imagePublicId,
      accentColor,
      backgroundGradient,
      backgroundColor,
      sortOrder,
      isActive
    } = req.body;

    const bannerMode = mode === 'image-only' ? 'image-only' : 'custom';

    if (bannerMode === 'custom') {
      if (!title || typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ error: 'BadRequest', message: 'Banner headline / title is required for custom banners.' });
        return;
      }

      if (!description || typeof description !== 'string' || description.trim() === '') {
        res.status(400).json({ error: 'BadRequest', message: 'Banner description / subtitle is required for custom banners.' });
        return;
      }
    }

    const created = db.createBanner({
      mode: bannerMode,
      title: title && title.trim() ? title.trim() : (bannerMode === 'image-only' ? 'Promotional Banner' : 'Special Promotion'),
      description: description !== undefined ? description.trim() : (bannerMode === 'image-only' ? '' : 'Discover fresh deals'),
      badgeText: badgeText !== undefined ? badgeText.trim() : (bannerMode === 'image-only' ? '' : 'Featured Promotion'),
      badgeIcon: badgeIcon || 'Sparkles',
      categoryKey: categoryKey || 'all',
      ctaText: ctaText !== undefined ? ctaText.trim() : (bannerMode === 'image-only' ? '' : 'Shop Now'),
      ctaLink,
      imageUrl,
      imagePublicId,
      accentColor: accentColor || '#a3e635',
      backgroundGradient: backgroundGradient || 'from-[#032419] via-[#053827] to-[#074732]',
      backgroundColor: backgroundColor || '#021811',
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      message: 'Banner created successfully.',
      banner: created
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/banners/:id - Update banner details (Admin only)
router.put('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const existing = db.getBannerById(id);
    if (!existing) {
      res.status(404).json({ error: 'NotFound', message: `Banner '${id}' not found.` });
      return;
    }

    const updated = db.updateBanner(id, req.body);
    res.status(200).json({
      message: 'Banner updated successfully.',
      banner: updated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/banners/:id/image - Upload or replace banner image (Admin only)
router.post(
  '/:id/image',
  requireAdmin,
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      const banner = db.getBannerById(id);
      if (!banner) {
        res.status(404).json({ error: 'NotFound', message: `Banner '${id}' not found.` });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'BadRequest', message: 'No image file was uploaded.' });
        return;
      }

      const validation = cloudinaryService.validateFile(req.file);
      if (!validation.valid) {
        res.status(400).json({ error: 'BadRequest', message: validation.error });
        return;
      }

      const oldPublicId = banner.imagePublicId;

      // Upload new image to Cloudinary (or simulated data URI if unconfigured)
      const uploadResult = await cloudinaryService.upload(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Save to database
      const updatedBanner = db.setBannerImage(id, uploadResult.url, uploadResult.publicId);

      // Clean up previous Cloudinary asset if replacing
      if (oldPublicId && oldPublicId !== uploadResult.publicId) {
        try {
          await cloudinaryService.delete(oldPublicId);
        } catch (cleanupErr) {
          console.warn(`Failed to cleanup previous Cloudinary asset ${oldPublicId}:`, cleanupErr);
        }
      }

      res.status(200).json({
        message: 'Banner image uploaded successfully.',
        imageUrl: uploadResult.url,
        imagePublicId: uploadResult.publicId,
        banner: updatedBanner
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/banners/:id/image - Remove banner image (Admin only)
router.delete('/:id/image', requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const banner = db.getBannerById(id);
    if (!banner) {
      res.status(404).json({ error: 'NotFound', message: `Banner '${id}' not found.` });
      return;
    }

    if (!banner.imageUrl && !banner.imagePublicId) {
      res.status(400).json({ error: 'BadRequest', message: 'This banner has no uploaded image to remove.' });
      return;
    }

    if (banner.imagePublicId) {
      await cloudinaryService.delete(banner.imagePublicId);
    }

    const updatedBanner = db.removeBannerImage(id);
    res.status(200).json({
      message: 'Banner image removed successfully.',
      banner: updatedBanner
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/banners/:id - Delete a banner (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const banner = db.getBannerById(id);
    if (!banner) {
      res.status(404).json({ error: 'NotFound', message: `Banner '${id}' not found.` });
      return;
    }

    // Clean up Cloudinary asset if banner has an uploaded image
    if (banner.imagePublicId) {
      try {
        await cloudinaryService.delete(banner.imagePublicId);
      } catch (cleanupErr) {
        console.warn(`Failed to cleanup Cloudinary asset for banner ${id}:`, cleanupErr);
      }
    }

    const deleted = db.deleteBanner(id);
    if (!deleted) {
      res.status(500).json({ error: 'InternalError', message: 'Failed to delete banner.' });
      return;
    }

    res.status(200).json({
      message: 'Banner deleted successfully.',
      deletedId: id
    });
  } catch (err) {
    next(err);
  }
});

export default router;
