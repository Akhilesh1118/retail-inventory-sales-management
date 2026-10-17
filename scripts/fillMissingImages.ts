/**
 * Script: Fill Missing Product Images in MongoDB Atlas & Cloudinary
 * 
 * Iterates through all products in MongoDB Atlas, finds any products without images,
 * generates a category-tailored vector illustration, uploads it to Cloudinary,
 * and updates the product record with permanent imageUrl & imagePublicId in both
 * MongoDB Atlas and the local state.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { cloudinaryService } from '../server/services/cloudinary.ts';
import { generateProductSvg } from '../server/services/productImageGenerator.ts';

dotenv.config();

export async function fillAllMissingProductImages() {
  console.log('====================================================');
  console.log(' RETAILFLOW — BULK FILL MISSING PRODUCT IMAGES');
  console.log('====================================================');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  if (mongoose.connection.readyState !== 1) {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Could not access MongoDB database handle.');
  }

  console.log(`Connected to database: '${db.databaseName}'`);
  console.log(`Cloudinary Cloud Name: '${cloudinaryService.getCloudName()}' (Configured: ${cloudinaryService.isConfigured()})`);

  const productsColl = db.collection('products');
  const allProducts = await productsColl.find({}).toArray();
  console.log(`\nTotal products found in database: ${allProducts.length}`);

  const missing = allProducts.filter((p) => !p.imageUrl || String(p.imageUrl).trim() === '');
  const existing = allProducts.length - missing.length;
  console.log(`Products already having valid images: ${existing}`);
  console.log(`Products missing images to populate: ${missing.length}\n`);

  if (missing.length === 0) {
    console.log('✅ All products already have valid images. Nothing to do!');
    return { total: allProducts.length, updated: 0, skipped: existing, failed: 0 };
  }

  let updated = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < missing.length; i++) {
    const product = missing[i];
    const progress = `[${i + 1}/${missing.length}]`;

    try {
      // 1. Generate customized vector SVG illustration
      const svgContent = generateProductSvg({
        name: product.name,
        category: product.category,
        sku: product.sku,
        sellingPrice: product.sellingPrice
      });

      const buffer = Buffer.from(svgContent, 'utf-8');
      const cleanSku = (product.sku || product._id.toString()).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `retail_${cleanSku}_${Date.now()}.svg`;

      // 2. Upload to Cloudinary
      const uploadRes = await cloudinaryService.upload(
        buffer,
        filename,
        'image/svg+xml'
      );

      // 3. Persist in MongoDB Atlas
      const nowIso = new Date().toISOString();
      await productsColl.updateOne(
        { _id: product._id },
        {
          $set: {
            imageUrl: uploadRes.url,
            imagePublicId: uploadRes.publicId,
            updatedAt: nowIso
          }
        }
      );

      updated++;
      console.log(`${progress} ✅ ${product.name} (${product.sku || 'No SKU'}) -> ${uploadRes.url}`);
    } catch (err: any) {
      failed++;
      console.error(`${progress} ❌ Failed for ${product.name}:`, err.message);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n====================================================');
  console.log(`🎉 Finished in ${durationSec}s!`);
  console.log(`   - Total Scanned: ${allProducts.length}`);
  console.log(`   - Successfully Updated: ${updated}`);
  console.log(`   - Previously Had Images: ${existing}`);
  console.log(`   - Failed: ${failed}`);
  console.log('====================================================');

  return { total: allProducts.length, updated, skipped: existing, failed };
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('fillMissingImages.ts')) {
  fillAllMissingProductImages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
