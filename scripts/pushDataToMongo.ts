import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DATA_FILE = path.resolve(process.cwd(), 'data/retail_db.json');

export interface MigrationSummary {
  users: { total: number; upserted: number };
  products: { total: number; upserted: number };
  movements: { total: number; upserted: number };
  sales: { total: number; upserted: number };
  banners: { total: number; upserted: number };
  config: { saved: boolean };
  durationMs: number;
}

export async function pushLocalDataToMongo(): Promise<MigrationSummary> {
  const startTime = Date.now();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Data file not found at ${DATA_FILE}`);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(raw);

  if (mongoose.connection.readyState !== 1) {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Could not access MongoDB database handle.');
  }

  console.log(`Connected to MongoDB Atlas database: '${db.databaseName}'`);

  const summary: MigrationSummary = {
    users: { total: (data.users || []).length, upserted: 0 },
    products: { total: (data.products || []).length, upserted: 0 },
    movements: { total: (data.movements || []).length, upserted: 0 },
    sales: { total: (data.sales || []).length, upserted: 0 },
    banners: { total: (data.banners || []).length, upserted: 0 },
    config: { saved: false },
    durationMs: 0
  };

  // 1. Push Users
  console.log(`\n[1/6] Pushing ${summary.users.total} users via bulk operations...`);
  const usersColl = db.collection('users');
  for (const user of data.users || []) {
    const existing = await usersColl.findOne({
      $or: [{ _id: user._id }, { username: user.username }, { email: user.email }]
    });
    const { _id, ...fields } = user;
    if (existing) {
      await usersColl.updateOne({ _id: existing._id }, { $set: fields });
    } else {
      await usersColl.insertOne(user);
    }
    summary.users.upserted++;
  }
  console.log(`✅ Users pushed: ${summary.users.upserted}`);

  // 2. Push Products (Batch bulkWrite)
  console.log(`\n[2/6] Pushing ${summary.products.total} products via high-performance bulkWrite...`);
  const productsColl = db.collection('products');
  if (data.products && data.products.length > 0) {
    const productOps = data.products.map((p: any) => {
      const { _id, ...fields } = p;
      return {
        updateOne: {
          filter: { _id },
          update: { $set: fields, $setOnInsert: { _id } },
          upsert: true
        }
      };
    });
    const prodRes = await productsColl.bulkWrite(productOps, { ordered: false });
    summary.products.upserted = (prodRes.upsertedCount || 0) + (prodRes.modifiedCount || 0) + (prodRes.matchedCount || 0);
  }
  console.log(`✅ Products pushed: ${summary.products.upserted}`);

  // 3. Push Movements (Batch bulkWrite into both 'movements' and 'inventorymovements')
  console.log(`\n[3/6] Pushing ${summary.movements.total} inventory movements via bulkWrite...`);
  const movementsColl = db.collection('movements');
  const invMovementsColl = db.collection('inventorymovements');
  if (data.movements && data.movements.length > 0) {
    const movementOps = data.movements.map((m: any) => {
      const { _id, ...fields } = m;
      return {
        updateOne: {
          filter: { _id },
          update: { $set: fields, $setOnInsert: { _id } },
          upsert: true
        }
      };
    });
    const [mvtRes] = await Promise.all([
      movementsColl.bulkWrite(movementOps, { ordered: false }),
      invMovementsColl.bulkWrite(movementOps, { ordered: false })
    ]);
    summary.movements.upserted = (mvtRes.upsertedCount || 0) + (mvtRes.modifiedCount || 0) + (mvtRes.matchedCount || 0);
  }
  console.log(`✅ Inventory Movements pushed: ${summary.movements.upserted}`);

  // 4. Push Sales (Batch bulkWrite)
  console.log(`\n[4/6] Pushing ${summary.sales.total} sales transactions via bulkWrite...`);
  const salesColl = db.collection('sales');
  if (data.sales && data.sales.length > 0) {
    const saleOps = data.sales.map((s: any) => {
      const { _id, ...fields } = s;
      return {
        updateOne: {
          filter: { _id },
          update: { $set: fields, $setOnInsert: { _id } },
          upsert: true
        }
      };
    });
    const saleRes = await salesColl.bulkWrite(saleOps, { ordered: false });
    summary.sales.upserted = (saleRes.upsertedCount || 0) + (saleRes.modifiedCount || 0) + (saleRes.matchedCount || 0);
  }
  console.log(`✅ Sales pushed: ${summary.sales.upserted}`);

  // 5. Push Banners (Batch bulkWrite into both 'banners' and 'herobanners')
  console.log(`\n[5/6] Pushing ${summary.banners.total} banners via bulkWrite...`);
  const bannersColl = db.collection('banners');
  const heroBannersColl = db.collection('herobanners');
  if (data.banners && data.banners.length > 0) {
    const bannerOps = data.banners.map((b: any) => {
      const { _id, ...fields } = b;
      return {
        updateOne: {
          filter: { _id },
          update: { $set: fields, $setOnInsert: { _id } },
          upsert: true
        }
      };
    });
    const [banRes] = await Promise.all([
      bannersColl.bulkWrite(bannerOps, { ordered: false }),
      heroBannersColl.bulkWrite(bannerOps, { ordered: false })
    ]);
    summary.banners.upserted = (banRes.upsertedCount || 0) + (banRes.modifiedCount || 0) + (banRes.matchedCount || 0);
  }
  console.log(`✅ Banners pushed: ${summary.banners.upserted}`);

  // 6. Push Config and Counter
  console.log('\n[6/6] Pushing store configuration and invoice counter...');
  const configColl = db.collection('storeconfigs');
  const countersColl = db.collection('counters');

  if (data.config) {
    await configColl.updateOne(
      { _id: 'store_config_default' as any },
      { $set: data.config, $setOnInsert: { _id: 'store_config_default' as any } },
      { upsert: true }
    );
    summary.config.saved = true;
  }

  if (data.invoiceCounter) {
    await countersColl.updateOne(
      { _id: 'invoice_counter' as any },
      { $set: { counter: data.invoiceCounter, updatedAt: new Date() }, $setOnInsert: { _id: 'invoice_counter' as any } },
      { upsert: true }
    );
  }
  console.log('✅ Configuration and counter saved.');

  summary.durationMs = Date.now() - startTime;
  return summary;
}

// If run directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  pushLocalDataToMongo()
    .then((summary) => {
      console.log('\n======================================================');
      console.log(' 🎉 ALL LOCAL DATA PUSHED TO MONGODB ATLAS SUCCESSFULLY!');
      console.log('======================================================');
      console.log(` - Users pushed:        ${summary.users.upserted}/${summary.users.total}`);
      console.log(` - Products pushed:     ${summary.products.upserted}/${summary.products.total}`);
      console.log(` - Movements pushed:    ${summary.movements.upserted}/${summary.movements.total}`);
      console.log(` - Sales Orders pushed: ${summary.sales.upserted}/${summary.sales.total}`);
      console.log(` - Hero Banners pushed: ${summary.banners.upserted}/${summary.banners.total}`);
      console.log(` - Store Configuration: ${summary.config.saved ? 'Saved' : 'Skipped'}`);
      console.log(` - Total Duration:      ${summary.durationMs}ms`);
      console.log('======================================================\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed with error:', err);
      process.exit(1);
    });
}
