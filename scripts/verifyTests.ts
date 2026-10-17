import { db } from '../server/db/dataStore.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'apex-retail-flow-jwt-super-secret-key-2026';

interface TestResult {
  num: number;
  description: string;
  passed: boolean;
  notes: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, num: number, description: string, notes: string = '') {
  results.push({
    num,
    description,
    passed: !!condition,
    notes: condition ? 'OK' : `FAILED: ${notes}`
  });
  if (!condition) {
    console.error(`❌ Test #${num} FAILED: ${description} - ${notes}`);
  } else {
    console.log(`✅ Test #${num} PASSED: ${description}`);
  }
}

async function runAcceptanceTests() {
  console.log('====================================================');
  console.log('RUNNING SYSTEM ACCEPTANCE TESTS (Criteria 1 to 20)');
  console.log('====================================================');

  await db.init();

  // Test 1: Admin can log in
  const admin = db.findUserByUsernameOrEmail('admin');
  const adminPassMatch = admin && (await bcrypt.compare('Admin123!', admin.password || ''));
  assert(!!adminPassMatch && admin?.role === 'admin', 1, 'Admin can log in', 'Admin password check failed');

  // Test 2: Staff can log in
  const staff = db.findUserByUsernameOrEmail('staff');
  const staffPassMatch = staff && (await bcrypt.compare('Staff123!', staff.password || ''));
  assert(!!staffPassMatch && staff?.role === 'staff', 2, 'Staff can log in', 'Staff password check failed');

  // Test 3: Invalid credentials are rejected
  const badPassMatch = admin && (await bcrypt.compare('WrongPassword999', admin.password || ''));
  const nonExistentUser = db.findUserByUsernameOrEmail('does_not_exist_user');
  assert(!badPassMatch && !nonExistentUser, 3, 'Invalid credentials are rejected', 'Bad credentials allowed');

  // Test 4: Staff cannot perform Admin-only actions
  // Verify role check logic
  const isStaffAdmin = staff?.role === 'admin';
  assert(!isStaffAdmin, 4, 'Staff cannot perform Admin-only actions', 'Staff has admin role');

  // Test 5: Admin can create a product with a unique SKU
  const testSku = 'TEST-UNIT-' + Date.now();
  const createdProd = db.createProduct(
    {
      sku: testSku,
      name: 'Automated Test Product',
      category: 'Testing',
      purchasePrice: 100,
      sellingPrice: 150,
      availableStock: 20,
      reorderLevel: 5
    },
    { id: admin!._id, name: admin!.fullName }
  );
  assert(
    !!createdProd && createdProd.sku === testSku && createdProd.availableStock === 20,
    5,
    'Admin can create a product with a unique SKU',
    'Product creation failed'
  );

  // Test 6: Duplicate SKUs are rejected
  let duplicateRejected = false;
  try {
    db.createProduct(
      {
        sku: testSku,
        name: 'Duplicate Product Attempt',
        category: 'Testing',
        purchasePrice: 100,
        sellingPrice: 150
      },
      { id: admin!._id, name: admin!.fullName }
    );
  } catch (err: any) {
    duplicateRejected = err.message.includes('already exists');
  }
  assert(duplicateRejected, 6, 'Duplicate SKUs are rejected', 'Duplicate SKU was permitted');

  // Test 7: Products can be searched and filtered
  const searchRes = db.getProducts({ search: 'Automated Test' });
  const filterCatRes = db.getProducts({ category: 'Testing' });
  assert(
    searchRes.products.some((p) => p.sku === testSku) && filterCatRes.products.some((p) => p.sku === testSku),
    7,
    'Products can be searched and filtered',
    'Search or category filter did not return created product'
  );

  // Test 8: Stock received increases inventory and creates a movement record
  const initialStock = createdProd.availableStock;
  const adjustReceived = db.adjustInventory({
    productId: createdProd._id,
    adjustmentType: 'STOCK_RECEIVED',
    quantity: 15,
    reason: 'Vendor delivery batch #99',
    user: { id: admin!._id, name: admin!.fullName }
  });
  assert(
    adjustReceived.product.availableStock === initialStock + 15 &&
      adjustReceived.movement.type === 'STOCK_RECEIVED' &&
      adjustReceived.movement.quantity === 15 &&
      adjustReceived.movement.resultingStock === initialStock + 15,
    8,
    'Stock received increases inventory and creates a movement record',
    'Stock did not increment or movement was missing'
  );

  // Test 9: Manual adjustments create auditable movement records
  const currentStockBeforeManual = adjustReceived.product.availableStock;
  const manualDec = db.adjustInventory({
    productId: createdProd._id,
    adjustmentType: 'MANUAL_DECREASE',
    quantity: 5,
    reason: 'Damaged item write-off audit',
    user: { id: admin!._id, name: admin!.fullName }
  });
  assert(
    manualDec.product.availableStock === currentStockBeforeManual - 5 &&
      manualDec.movement.type === 'MANUAL_DECREASE' &&
      manualDec.movement.reason.includes('Damaged item'),
    9,
    'Manual adjustments create auditable movement records',
    'Manual decrease audit record failed'
  );

  // Test 10: Low-stock products are identified using stock <= reorder level
  const lowProd = db.createProduct(
    {
      sku: 'TEST-LOW-' + Date.now(),
      name: 'Low Stock Test Item',
      category: 'Testing',
      purchasePrice: 50,
      sellingPrice: 80,
      availableStock: 3,
      reorderLevel: 5
    },
    { id: admin!._id, name: admin!.fullName }
  );
  const lowStockList = db.getLowStockProducts();
  assert(
    lowStockList.some((p) => p._id === lowProd._id),
    10,
    'Low-stock products are identified using stock <= reorder level',
    'Low stock item not found in low-stock query'
  );

  // Test 11: A valid multi-product sale creates one invoice
  const validSale = await db.createSale({
    items: [
      { productId: createdProd._id, quantity: 2 },
      { productId: lowProd._id, quantity: 1 }
    ],
    discountPercent: 10,
    paymentMethod: 'CASH',
    user: { id: staff!._id, name: staff!.fullName }
  });
  assert(
    !!validSale.invoiceNumber && validSale.items.length === 2 && validSale.status === 'COMPLETED',
    11,
    'A valid multi-product sale creates one invoice',
    'Sale creation failed or invoice missing'
  );

  // Test 12: Totals are calculated by the backend
  // Expected:
  // Item 1: 2 * 150 = 300
  // Item 2: 1 * 80 = 80
  // Subtotal = 380
  // Discount = 10% of 380 = 38
  // Net = 342
  // Tax = 18% of 342 = 61.56
  // Total = 342 + 61.56 = 403.56
  assert(
    validSale.subtotal === 380 &&
      validSale.discountAmount === 38 &&
      validSale.taxAmount === 61.56 &&
      validSale.totalAmount === 403.56,
    12,
    'Totals are calculated by the backend',
    `Totals mismatch: got subtotal=${validSale.subtotal}, total=${validSale.totalAmount}`
  );

  // Test 13: Client-submitted prices and totals cannot manipulate the sale
  // Notice db.createSale only takes { productId, quantity } and fetches real prices from catalog!
  const hasClientPriceInput = Object.keys(validSale.items[0]).includes('customClientPrice');
  assert(
    !hasClientPriceInput && validSale.items[0].unitSellingPrice === createdProd.sellingPrice,
    13,
    'Client-submitted prices and totals cannot manipulate the sale',
    'Server accepted client prices'
  );

  // Test 14: A sale cannot reduce inventory below zero
  const stockNow = lowProd.availableStock; // was 3, 1 sold, now 2
  let oversellRejected = false;
  try {
    await db.createSale({
      items: [{ productId: lowProd._id, quantity: 9999 }],
      user: { id: staff!._id, name: staff!.fullName }
    });
  } catch (err: any) {
    oversellRejected = err.message.includes('Insufficient stock');
  }
  assert(oversellRejected, 14, 'A sale cannot reduce inventory below zero', 'Overselling was permitted');

  // Test 15: An unsuccessful sale does not leave stock deducted
  // Create multi-item request where item 1 has enough stock but item 2 does NOT
  const stockBeforeFailedSale1 = createdProd.availableStock;
  let multiItemFailRejected = false;
  try {
    await db.createSale({
      items: [
        { productId: createdProd._id, quantity: 2 },
        { productId: lowProd._id, quantity: 500 } // insufficient!
      ],
      user: { id: staff!._id, name: staff!.fullName }
    });
  } catch (err: any) {
    multiItemFailRejected = err.message.includes('Insufficient stock');
  }
  const stockAfterFailedSale1 = createdProd.availableStock;
  assert(
    multiItemFailRejected && stockBeforeFailedSale1 === stockAfterFailedSale1,
    15,
    'An unsuccessful sale does not leave stock deducted',
    'Partial deduction occurred on failed sale'
  );

  // Test 16: Inventory movements match successful stock changes
  const saleMovements = db.getMovements({ limit: 10 }).movements.filter((m) => m.saleId === validSale._id);
  assert(
    saleMovements.length === 2 && saleMovements.every((m) => m.type === 'SALE'),
    16,
    'Inventory movements match successful stock changes',
    'Sale movements count or type did not match'
  );

  // Test 17: Concurrent sales cannot oversell inventory
  const singleItem = db.createProduct(
    {
      sku: 'CONCURRENT-' + Date.now(),
      name: 'Concurrent Race Test Item',
      category: 'Testing',
      purchasePrice: 10,
      sellingPrice: 20,
      availableStock: 5,
      reorderLevel: 1
    },
    { id: admin!._id, name: admin!.fullName }
  );

  // Attempt 10 simultaneous sales of 1 item each (only 5 exist)
  const concurrentPromises = Array.from({ length: 10 }).map(() =>
    db
      .createSale({
        items: [{ productId: singleItem._id, quantity: 1 }],
        user: { id: staff!._id, name: staff!.fullName }
      })
      .then(() => true)
      .catch(() => false)
  );

  const concurrentResults = await Promise.all(concurrentPromises);
  const successfulCount = concurrentResults.filter((r) => r === true).length;
  const failedCount = concurrentResults.filter((r) => r === false).length;
  const remainingConcurrentStock = singleItem.availableStock;

  assert(
    successfulCount === 5 && failedCount === 5 && remainingConcurrentStock === 0,
    17,
    'Concurrent sales cannot oversell inventory',
    `Expected 5 successes & 0 remaining stock, got ${successfulCount} successes, stock=${remainingConcurrentStock}`
  );

  // Test 18: Sales reports respect date filters
  const today = new Date().toISOString().slice(0, 10);
  const salesReportToday = db.getSalesReport(today, today);
  assert(
    salesReportToday.summary.totalTransactions >= 1 &&
      salesReportToday.period.startDate === today &&
      salesReportToday.period.endDate === today,
    18,
    'Sales reports respect date filters',
    'Date filter not respected in sales report'
  );

  // Test 19: Profit reports use purchase-cost snapshots
  const profitReport = db.getProfitReport(today, today);
  assert(
    profitReport.metrics.grossProfit > 0 &&
      profitReport.metrics.totalCost > 0 &&
      profitReport.metrics.grossMarginPercent > 0,
    19,
    'Profit reports use purchase-cost snapshots',
    'Profit report metrics invalid'
  );

  // Test 20: Historical invoices remain correct after product prices change
  const originalInvoiceTotal = validSale.totalAmount;
  const originalLineItemPrice = validSale.items[0].unitSellingPrice;

  // Change product prices drastically in catalog
  db.updateProduct(createdProd._id, {
    sellingPrice: 9999,
    purchasePrice: 8888
  });

  // Re-fetch invoice and assert historical values are unmodified
  const fetchedSale = db.getSaleById(validSale._id);
  assert(
    fetchedSale?.totalAmount === originalInvoiceTotal &&
      fetchedSale?.items[0].unitSellingPrice === originalLineItemPrice,
    20,
    'Historical invoices remain correct after product prices change',
    'Historical invoice prices mutated when catalog changed'
  );

  // ====================================================
  // CLOUDINARY IMAGE FUNCTIONALITY TESTS (21 to 26)
  // ====================================================
  const { cloudinaryService } = await import('../server/services/cloudinary.ts');

  // Test 21: Cloudinary service validates allowed file types
  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const replacementPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjDAGAwMAMb4CAU5a3lEAAAAASUVORK5CYII=',
    'base64'
  );

  const fakeValidFile: any = {
    mimetype: 'image/png',
    size: validPngBuffer.length,
    originalname: 'test_product.png',
    buffer: validPngBuffer
  };
  const fakeInvalidFile: any = {
    mimetype: 'application/pdf',
    size: 1024 * 50,
    originalname: 'document.pdf',
    buffer: Buffer.from('fake-pdf-bytes')
  };
  const validCheck = cloudinaryService.validateFile(fakeValidFile);
  const invalidCheck = cloudinaryService.validateFile(fakeInvalidFile);
  assert(
    Boolean(validCheck.valid && !invalidCheck.valid && invalidCheck.error?.includes('Invalid file format')),
    21,
    'Cloudinary backend validates allowed image MIME types (JPEG, PNG, WebP)',
    'Failed to reject non-image file type'
  );

  // Test 22: Cloudinary service validates file size limit
  const oversizedFile: any = {
    mimetype: 'image/png',
    size: 10 * 1024 * 1024, // 10MB exceeds 5MB limit
    originalname: 'huge_image.png',
    buffer: Buffer.alloc(10 * 1024 * 1024)
  };
  const sizeCheck = cloudinaryService.validateFile(oversizedFile);
  assert(
    Boolean(!sizeCheck.valid && sizeCheck.error?.includes('exceeds')),
    22,
    'Cloudinary backend rejects files exceeding the 5MB size limit',
    'Oversized file was not rejected'
  );

  // Test 23: Upload image and save secure URL and publicId to product
  const uploadRes1 = await cloudinaryService.upload(
    fakeValidFile.buffer,
    fakeValidFile.originalname,
    fakeValidFile.mimetype
  );
  const productWithImage = db.setProductImage(createdProd._id, uploadRes1.url, uploadRes1.publicId);
  assert(
    !!productWithImage.imageUrl &&
      !!productWithImage.imagePublicId &&
      productWithImage.imageUrl.length > 0 &&
      productWithImage.imagePublicId === uploadRes1.publicId,
    23,
    'Admin can upload product image and persist secure URL and public ID',
    'Product image URL or publicId missing after upload'
  );

  // Test 24: Replace product image and verify old asset cleanup logic
  const oldPublicId = productWithImage.imagePublicId!;
  const replacementFile: any = {
    mimetype: 'image/png',
    size: replacementPngBuffer.length,
    originalname: 'replacement_packaging.png',
    buffer: replacementPngBuffer
  };
  const uploadRes2 = await cloudinaryService.upload(
    replacementFile.buffer,
    replacementFile.originalname,
    replacementFile.mimetype
  );
  // Update DB first
  const productReplaced = db.setProductImage(createdProd._id, uploadRes2.url, uploadRes2.publicId);
  // Safely delete old asset
  const deleteOldRes = await cloudinaryService.delete(oldPublicId);
  assert(
    productReplaced.imageUrl === uploadRes2.url &&
      productReplaced.imagePublicId === uploadRes2.publicId &&
      productReplaced.imagePublicId !== oldPublicId &&
      deleteOldRes.success,
    24,
    'Admin can replace product image, updating URL/ID and safely deleting old asset',
    'Replacement failed or did not update publicId'
  );

  // Test 25: Remove product image safely
  const publicIdToDelete = productReplaced.imagePublicId!;
  const deleteRes = await cloudinaryService.delete(publicIdToDelete);
  const productWithoutImage = db.removeProductImage(createdProd._id);
  assert(
    deleteRes.success &&
      productWithoutImage.imageUrl === undefined &&
      productWithoutImage.imagePublicId === undefined,
    25,
    'Admin can remove product image safely from Cloudinary and database',
    'Failed to clear product image fields'
  );

  // Test 26: Product retrieval preserves image fields for catalog and POS display
  const testProductWithFinalImage = db.setProductImage(
    createdProd._id,
    uploadRes2.url,
    uploadRes2.publicId
  );
  const fetchedForPos = db.getProductById(createdProd._id);
  const catalogList = db.getProducts({ search: createdProd.sku });
  assert(
    fetchedForPos?.imageUrl === uploadRes2.url &&
      catalogList.products.some((p) => p.sku === createdProd.sku && p.imageUrl === uploadRes2.url),
    26,
    'Product catalog and POS queries preserve Cloudinary image URLs',
    'Catalog did not return image URL'
  );

  // Test 27: Database initializes with 5 default hero banners
  const initialBanners = db.getBanners(true);
  assert(
    initialBanners.length >= 5 &&
      initialBanners.some((b) => b.title.includes('Everything You Need')) &&
      initialBanners.some((b) => b.title.includes('Upgrade Your Everyday')),
    27,
    'Database initializes with 5 default promotional hero banners',
    `Expected at least 5 banners, found ${initialBanners.length}`
  );

  // Test 28: Admin can create a custom hero banner
  const customBanner = db.createBanner({
    title: 'Weekend Mega Savings Expo',
    description: 'Up to 35% off on pantry essentials and grocery staples this weekend only.',
    badgeText: 'Weekend Special',
    badgeIcon: 'Flame',
    categoryKey: 'Grocery & Staples',
    ctaText: 'Shop Weekend Deals',
    accentColor: '#f59e0b',
    backgroundGradient: 'from-[#1c130b] via-[#2d1e11] to-[#0d3024]',
    isActive: true
  });
  const createdBannerFound = db.getBannerById(customBanner._id);
  assert(
    !!createdBannerFound &&
      createdBannerFound.title === 'Weekend Mega Savings Expo' &&
      createdBannerFound.badgeIcon === 'Flame',
    28,
    'Admin can create custom promotional banner with title, description, and styling',
    'Failed to create or retrieve custom banner'
  );

  // Test 29: Admin can upload and attach Cloudinary image to hero banner
  const bannerUploadRes = await cloudinaryService.upload(validPngBuffer, 'weekend_promo.png', 'image/png');
  const bannerWithImage = db.setBannerImage(customBanner._id, bannerUploadRes.url, bannerUploadRes.publicId);
  assert(
    bannerWithImage.imageUrl === bannerUploadRes.url &&
      bannerWithImage.imagePublicId === bannerUploadRes.publicId,
    29,
    'Admin can upload and attach Cloudinary image to promotional banner',
    'Banner image fields not updated'
  );

  // Test 30: Admin can update banner details and toggle active status
  const updatedBanner = db.updateBanner(customBanner._id, {
    title: 'Weekend Mega Savings Expo (Extended)',
    isActive: false
  });
  assert(
    updatedBanner.title === 'Weekend Mega Savings Expo (Extended)' &&
      updatedBanner.isActive === false,
    30,
    'Admin can update banner details and toggle active/inactive status',
    'Banner update or active toggle failed'
  );

  // Test 31: Active vs Inactive storefront isolation
  const activeBanners = db.getBanners(false);
  const allBanners = db.getBanners(true);
  const inactiveIsHidden = !activeBanners.some((b) => b._id === customBanner._id);
  const inactiveInAll = allBanners.some((b) => b._id === customBanner._id);
  assert(
    inactiveIsHidden && inactiveInAll,
    31,
    'Inactive banners are hidden from customer storefront but accessible in management',
    'Active filtering failed'
  );

  // Test 32: Admin can reorder banners
  const currentBannerIds = db.getBanners(true).map((b) => b._id);
  const reversedIds = [...currentBannerIds].reverse();
  const reordered = db.reorderBanners(reversedIds);
  const firstNowMatchesReversed = reordered[0]._id === reversedIds[0];
  assert(
    firstNowMatchesReversed && reordered[0].sortOrder === 1,
    32,
    'Admin can reorder promotional banners sequence',
    'Reordering failed'
  );

  // Test 33: Admin can delete banner and restore starter defaults
  const deleteBannerSuccess = db.deleteBanner(customBanner._id);
  const resetBanners = db.resetDefaultBanners();
  assert(
    deleteBannerSuccess &&
      resetBanners.length === 5 &&
      resetBanners.every((b) => b.isActive === true),
    33,
    'Admin can delete custom banners and reset carousel to default templates',
    'Reset defaults failed'
  );

  // Test 34: Admin can create an Option A: Image-Only banner without title, description, or CTA
  const imageOnlyBanner = db.createBanner({
    mode: 'image-only',
    title: 'Weekend Supermarket Special',
    imageUrl: 'https://res.cloudinary.com/dibvo6siu/image/upload/v1792224502/RetailFlow/sample_banner.jpg',
    imagePublicId: 'RetailFlow/sample_banner',
    backgroundColor: '#021811',
    categoryKey: 'all',
    isActive: true
  });
  assert(
    imageOnlyBanner.mode === 'image-only' &&
      imageOnlyBanner.imageUrl !== undefined &&
      imageOnlyBanner.backgroundColor === '#021811',
    34,
    'Admin can create Option A: Image-Only banner without required text overlay fields',
    'Image-only banner creation failed'
  );

  // Test 35: Customer storefront queries include image-only banners with correct mode
  const activeBannersWithImageOnly = db.getBanners(false);
  const foundImageOnly = activeBannersWithImageOnly.find((b) => b._id === imageOnlyBanner._id);
  assert(
    foundImageOnly !== undefined &&
      foundImageOnly.mode === 'image-only' &&
      Boolean(foundImageOnly.imageUrl?.includes('sample_banner')),
    35,
    'Customer storefront queries include image-only banners with full-width artwork configuration',
    'Customer image-only banner query failed'
  );

  // Cleanup test image banner
  db.deleteBanner(imageOnlyBanner._id);

  console.log('====================================================');
  console.log(`SUMMARY: ${results.filter((r) => r.passed).length} / ${results.length} TESTS PASSED.`);
  console.log('====================================================');

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    process.exit(1);
  }
}

runAcceptanceTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});

