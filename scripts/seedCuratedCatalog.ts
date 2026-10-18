import 'dotenv/config';
import mongoose from 'mongoose';
import { cloudinaryService } from '../server/services/cloudinary.ts';

const EXPECTED_DATABASE = 'RestaurantPOS';
const now = new Date();
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=85`;

type SeedProduct = {
  sku: string; name: string; category: string; sellingPrice: number; unit: string;
  description: string; image: string; imageCredit?: string; imageSourcePage?: string;
};

const products: SeedProduct[] = [
  ['CAT-RICE-001','White Rice (1kg)','Grocery & Staples',98,'pack','Everyday white rice in a convenient 1 kg pack.','1651793371427-ad065df0d208'],
  ['CAT-RICE-002','Basmati Rice (2kg)','Grocery & Staples',245,'bag','Basmati rice in a 2 kg bag.','1723475158229-894679ca024e'],
  ['CAT-RICE-003','Brown Rice (1kg)','Grocery & Staples',110,'pack','Whole-grain brown rice in a 1 kg pack.','1686820740687-426a7b9b2043'],
  ['CAT-LENT-001','Red Lentils (500g)','Grocery & Staples',85,'pack','Red lentils in a 500 g pack for everyday cooking.','1672660589379-891ab59588a8'],
  ['CAT-LENT-002','Red Lentils (1kg)','Grocery & Staples',160,'pack','Red lentils in a value 1 kg pack.','1614373532201-c40b993f0013'],
  ['CAT-CHIC-001','Chickpeas (1kg)','Grocery & Staples',165,'pack','Dried chickpeas in a 1 kg pack.','1767875816994-88dd9d05ce2f'],
  ['CAT-BEAN-001','Black Beans (500g)','Grocery & Staples',95,'pack','Dried black beans in a 500 g pack.','1709229851054-a09c8f7bd7e3'],
  ['CAT-OATS-001','Rolled Oats (500g)','Grocery & Staples',90,'pack','Rolled oats in a 500 g pack for breakfast and baking.','1676289124506-bdce1e1acc97'],
  ['CAT-CORN-001','Whole Corn Kernels (500g)','Grocery & Staples',80,'pack','Whole corn kernels in a 500 g pack.','1635843107983-264f83647ba3'],
  ['CAT-POTA-001','Potatoes (1kg)','Grocery & Staples',50,'pack','Fresh potatoes in a 1 kg pack.','1518977676601-b53f82aba655'],
  ['CAT-ONIO-001','Brown Onions (500g)','Grocery & Staples',25,'pack','Fresh brown onions in a 500 g pack.','1757281096733-1e51cb2f1aa6'],
  ['CAT-ONIO-002','Red Onions (1kg)','Grocery & Staples',55,'pack','Fresh red onions in a 1 kg pack.','1741517480859-cc010cff7e6a'],
  ['CAT-CARR-001','Carrots (500g)','Grocery & Staples',35,'pack','Fresh carrots in a 500 g pack.','1662318183942-a51f691538ba'],
  ['CAT-CARR-002','Carrots (1kg)','Grocery & Staples',65,'pack','Fresh carrots in a 1 kg pack.','1590868309235-ea34bed7bd7f'],
  ['CAT-TOMA-001','Tomatoes (500g)','Grocery & Staples',30,'pack','Fresh tomatoes in a 500 g pack.','1562695530-ca03c4b98623'],
  ['CAT-CUCU-001','Cucumbers (500g)','Grocery & Staples',30,'pack','Fresh cucumbers in a 500 g pack.','1604977042946-1eecc30f269e'],
  ['CAT-CUCU-002','Cucumbers (1kg)','Grocery & Staples',55,'pack','Fresh cucumbers in a 1 kg pack.','1694153192731-ab5445654427'],
  ['CAT-CAUL-001','Cauliflower (1 piece)','Grocery & Staples',40,'piece','One fresh cauliflower.','1692956706779-576c151ec712'],
  ['CAT-PEPP-001','Red Bell Peppers (500g)','Grocery & Staples',45,'pack','Fresh red bell peppers in a 500 g pack.','1513530774447-73de85f43d60'],
  ['CAT-PEPP-002','Red Bell Peppers (1kg)','Grocery & Staples',85,'pack','Fresh red bell peppers in a 1 kg pack.','1735959096977-4f435c12428d'],
  ['CAT-BROC-001','Broccoli (1 piece)','Grocery & Staples',75,'piece','One fresh broccoli head.','1748017079162-01d97c0789ea'],
  ['CAT-CABB-001','Green Cabbage (1 piece)','Grocery & Staples',35,'piece','One fresh green cabbage.','1697345208214-7deed24fb445'],
  ['CAT-GRAP-001','Grapes (500g)','Grocery & Staples',99,'pack','Fresh grapes in a 500 g pack.','1615485925836-8ddb4b7f4433'],
  ['CAT-ORAN-001','Oranges (4 pieces)','Grocery & Staples',55,'pack','Four fresh oranges.','1582049091196-9b88ec8295f9'],
  ['CAT-ORAN-002','Oranges (1kg)','Grocery & Staples',110,'pack','Fresh oranges in a 1 kg pack.','1624109789237-6f796cd9e570'],
  ['CAT-LEMO-001','Lemons (4 pieces)','Grocery & Staples',35,'pack','Four fresh lemons.','1642849573887-179db1a9a779'],
  ['CAT-LEMO-002','Lemons (1kg)','Grocery & Staples',70,'pack','Fresh lemons in a 1 kg pack.','1744132241294-ae4416fbaf3e'],
  ['CAT-PEAR-001','Green Pears (4 pieces)','Grocery & Staples',90,'pack','Four fresh green pears.','1612100616857-c056b93628b4'],
  ['CAT-PEAR-002','Yellow Pears (4 pieces)','Grocery & Staples',90,'pack','Four fresh yellow pears.','1645345132099-505a20ad59a9'],
  ['CAT-AVOC-001','Avocado (1 piece)','Grocery & Staples',90,'piece','One fresh avocado.','1634075281468-6980d76be8f7'],
  ['CAT-AVOC-002','Avocados (2 pieces)','Grocery & Staples',160,'pack','Two fresh avocados.','1596119415004-be78a87f8d14'],
  ['CAT-PINE-001','Pineapple (1 piece)','Grocery & Staples',70,'piece','One whole fresh pineapple.','1490885578174-acda8905c2c6'],
  ['CAT-PINE-002','Pineapple (2 pieces)','Grocery & Staples',125,'pack','Two whole fresh pineapples.','1562534394-19ef6c1ffb37'],
  ['CAT-STRA-001','Strawberries (250g)','Grocery & Staples',110,'pack','Fresh strawberries in a 250 g pack.','1650833831493-72a9b1b352de'],
  ['CAT-STRA-002','Strawberries (500g)','Grocery & Staples',210,'pack','Fresh strawberries in a 500 g pack.','1711232346726-1fdd9ff567b0'],
  ['CAT-STRA-003','Strawberries (1kg)','Grocery & Staples',390,'pack','Fresh strawberries in a 1 kg pack.','1685130050521-821d122f4915'],
  ['CAT-STRA-004','Strawberries (750g)','Grocery & Staples',300,'pack','Fresh strawberries in a 750 g pack.','1606774191372-8755db53d4c1'],
  ['CAT-BLUE-001','Blueberries (125g)','Grocery & Staples',180,'pack','Fresh blueberries in a 125 g pack.','1597774681009-f8679cf72348'],
  ['CAT-WATE-001','Small Watermelon (2–3kg)','Grocery & Staples',90,'piece','One small whole watermelon, typically around 2–3 kg.','1503357960973-aa1599e849dc'],
  ['CAT-WATE-002','Medium Watermelon (3–5kg)','Grocery & Staples',150,'piece','One medium whole watermelon, typically around 3–5 kg.','1629084092232-b7b3fa74cd4b'],
  ['CAT-WATE-003','Large Watermelon (5–7kg)','Grocery & Staples',220,'piece','One large whole watermelon, typically around 5–7 kg.','1707247353332-1833464ba81a'],
  ['CAT-WATE-004','Watermelon Pieces (500g)','Grocery & Staples',60,'pack','Cut watermelon pieces in a 500 g pack.','1587049352846-4a222e784d38'],
  ['CAT-BANA-001','Bananas (6 pieces)','Grocery & Staples',35,'pack','Six fresh bananas.','1571771894821-ce9b6c11b08e'],
  ['CAT-BANA-002','Bananas (1kg)','Grocery & Staples',60,'pack','Fresh bananas in a 1 kg pack.','1675586677787-fcf4b23c974e'],
  ['CAT-BANA-003','Bananas (2kg)','Grocery & Staples',115,'pack','Fresh bananas in a 2 kg pack.','1587132137056-bfbf0166836e'],
  ['CAT-BANA-004','Bananas (500g)','Grocery & Staples',30,'pack','Fresh bananas in a 500 g pack.','1640958900081-7b069dd23e9c'],
  ['CAT-APPL-001','Red Apples (4 pieces)','Grocery & Staples',140,'pack','Four fresh red apples.','1634228372613-afe0ba3b9b74'],
  ['CAT-APPL-002','Red Apples (1kg)','Grocery & Staples',260,'pack','Fresh red apples in a 1 kg pack.','1667443689820-913778704744'],
  ['CAT-APPL-003','Green Apples (4 pieces)','Grocery & Staples',150,'pack','Four fresh green apples.','1611574474484-ced6cb70a2cf'],
  ['CAT-ALMO-001','Whole Almonds (250g)','Snacks & Dry Fruits',249,'pack','Whole almonds in a 250 g pack.','1631815333332-e3ffb24e2bf8'],
  ['CAT-ALMO-002','Whole Almonds (750g)','Snacks & Dry Fruits',749,'pack','Whole almonds in a 750 g pack.','1615485737651-580c9159c89a'],
  ['CAT-ALMO-003','Whole Almonds (1kg)','Snacks & Dry Fruits',949,'pack','Whole almonds in a 1 kg pack.','1582390494081-de023fffb7df'],
  ['CAT-ALMO-004','Whole Almonds (2kg)','Snacks & Dry Fruits',1799,'pack','Whole almonds in a 2 kg pack.','1642443593360-819168ddf4dd'],
  ['CAT-CASH-001','Cashews (250g)','Snacks & Dry Fruits',299,'pack','Cashews in a 250 g pack.','1726771517475-e7acdd34cd8a'],
  ['CAT-CASH-002','Cashews (500g)','Snacks & Dry Fruits',579,'pack','Cashews in a 500 g pack.','1649431473538-216ed9b3859f'],
].map(([sku,name,category,sellingPrice,unit,description,image]) => ({sku,name,category,sellingPrice,unit,description,image: photo(String(image))} as SeedProduct));

const householdProducts: SeedProduct[] = [
  {
    sku: 'HOME-CLN-011', name: 'Multi-Purpose Spray Cleaner (500ml)', category: 'Household & Cleaning', sellingPrice: 149, unit: 'bottle',
    description: 'General household spray cleaner in a 500 ml bottle.', image: photo('1550963295-019d8a8a61c5'),
    imageCredit: 'Crystal Chabot / Unsplash', imageSourcePage: 'https://unsplash.com/photos/clear-spray-bottle-9gzU1mtTzWM'
  },
  {
    sku: 'HOME-SPG-012', name: 'Kitchen Cleaning Sponge (1 piece)', category: 'Household & Cleaning', sellingPrice: 25, unit: 'piece',
    description: 'Kitchen cleaning sponge for everyday dishwashing and surface cleaning.', image: photo('1778178965223-e5a29e612504'),
    imageCredit: 'Gaana Srinivas / Unsplash', imageSourcePage: 'https://unsplash.com/photos/a-yellow-sponge-casts-a-shadow-on-a-blue-background-7YJV_3uLF4o'
  },
  {
    sku: 'HOME-SCR-013', name: 'Dish Scrubbers (3 pieces)', category: 'Household & Cleaning', sellingPrice: 59, unit: 'pack',
    description: 'Kitchen scrubbers for washing dishes and cookware.', image: photo('1577369117918-7e3785e39cb7'),
    imageCredit: 'Volodymyr Hryshchenko / Unsplash', imageSourcePage: 'https://unsplash.com/photos/yellow-sponge-between-two-steel-wools-WU9dA3C4R28'
  },
  {
    sku: 'HOME-GLV-014', name: 'Reusable Cleaning Gloves (1 pair)', category: 'Household & Cleaning', sellingPrice: 89, unit: 'pair',
    description: 'Reusable household cleaning gloves for routine bathroom and kitchen chores.', image: photo('1737372805905-be0b91ec86fb'),
    imageCredit: 'GoGoNano / Unsplash', imageSourcePage: 'https://unsplash.com/photos/a-pair-of-gloves-and-a-sponge-are-sitting-on-a-bathtub-SaVqlZczQXs'
  },
];
products.push(...householdProducts);

const repairs = [
  { sku: 'GROC-BAS-001', changes: { name: 'Basmati Rice (5kg)', description: 'Basmati rice in a 5 kg bag.' } },
  { sku: 'BEV-TEA-003', changes: { name: 'Black Tea (500g)', description: 'Black tea for brewing at home.' } },
  { sku: 'BEV-COF-004', changes: { name: 'Battlecreek House Blend Coffee', description: 'Battlecreek house blend coffee for brewing at home.', unit: 'bag' } },
  { sku: 'ELEC-EAR-007', changes: { name: 'Wireless Earbuds with Charging Case', description: 'Wireless earbuds supplied with a charging case.' } },
  { sku: 'SNK-ALM-009', changes: { name: 'Whole Almonds (500g)', description: 'Whole raw almonds in a 500 g pack.' } },
];
const retireSkus = ['GROC-DAL-002','ELEC-CBL-005','ELEC-BNK-006','HOME-DET-010'];

async function uploadImage(url: string, publicId: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Source image returned HTTP ${response.status}: ${url}`);
  const contentType = response.headers.get('content-type')?.split(';')[0] || '';
  if (!['image/jpeg','image/png','image/webp'].includes(contentType)) throw new Error(`Unexpected image content type ${contentType}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000 || bytes.length > 5 * 1024 * 1024) throw new Error(`Invalid image size ${bytes.length}: ${url}`);
  const uploaded = await cloudinaryService.upload(bytes, publicId, contentType);
  const check = await fetch(uploaded.url);
  if (!check.ok || !check.headers.get('content-type')?.startsWith('image/')) throw new Error(`Cloudinary image verification failed for ${publicId}`);
  return uploaded;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  if (!cloudinaryService.isConfigured()) throw new Error('Valid Cloudinary credentials are required; refusing simulated storage.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection has no selected database.');
  if (db.databaseName !== EXPECTED_DATABASE) throw new Error(`Refusing writes to unexpected database '${db.databaseName}'.`);
  const coll = db.collection('products');
  const categories = await coll.distinct('category');
  for (const category of ['Grocery & Staples','Snacks & Dry Fruits','Household & Cleaning']) {
    if (!categories.includes(category)) throw new Error(`Expected existing category '${category}' was not found.`);
  }
  const skuList = products.map(p => p.sku);
  if (new Set(skuList).size !== products.length || new Set(products.map(p => p.image)).size !== products.length) throw new Error('Seed SKUs or source image URLs are duplicated.');
  const existingSeed = await coll.find({ sku: { $in: skuList } }).toArray();
  const existingBySku = new Map(existingSeed.map(p => [p.sku, p]));
  const assetsToCleanup: string[] = [];
  const staged = [] as any[];
  let skipped = 0;
  try {
    for (const item of products) {
      const found = existingBySku.get(item.sku);
      if (found?.imageUrl?.startsWith('https://res.cloudinary.com/') && found.imagePublicId) {
        const unchanged = found.name === item.name && found.category === item.category &&
          found.sellingPrice === item.sellingPrice && found.description === item.description &&
          found.unit === item.unit && found.imageSourceUrl === item.image;
        if (unchanged) { skipped++; continue; }
        staged.push({ ...found, name:item.name, category:item.category, sellingPrice:item.sellingPrice,
          purchasePrice:Math.round(item.sellingPrice * 0.72), description:item.description, unit:item.unit,
          imageSourceUrl:item.image, imageCredit:item.imageCredit || 'Unsplash', imageSourcePage:item.imageSourcePage, isActive:true, updatedAt:now });
        continue;
      }
      const image = await uploadImage(item.image, `catalog-${item.sku.toLowerCase()}`);
      assetsToCleanup.push(image.publicId);
      const purchasePrice = Math.round(item.sellingPrice * 0.72);
      const availableStock = 18 + (staged.length % 23);
      staged.push({
        _id: found?._id ?? `prd_catalog_${item.sku}`,
        sku: item.sku, name: item.name, category: item.category,
        purchasePrice, sellingPrice: item.sellingPrice, availableStock,
        reorderLevel: 8, isActive: true, imageUrl: image.url, imagePublicId: image.publicId,
        imageSourceUrl: item.image, imageSourcePage: item.imageSourcePage, imageCredit: item.imageCredit || 'Unsplash', description: item.description,
        unit: item.unit, taxRatePercent: 0, createdAt: found?.createdAt ?? now, updatedAt: now
      });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (staged.length) {
          await coll.bulkWrite(staged.map(p => {
            const { _id, ...fields } = p;
            return { updateOne: { filter: { sku: p.sku }, update: { $set: fields, $setOnInsert: { _id } }, upsert: true } };
          }), { ordered: true, session });
          const movementDocs = staged.map(p => ({
            _id: `mvt_catalog_${p.sku}`, productId: p._id, productSku: p.sku,
            productName: p.name, type: 'STOCK_RECEIVED', quantity: p.availableStock,
            previousStock: 0, resultingStock: p.availableStock,
            userId: 'system_catalog_seed', userName: 'Catalog seed',
            reason: 'Initial catalog stock intake', timestamp: now, createdAt: now, updatedAt: now
          }));
          for (const name of ['movements','inventorymovements']) {
            const movementColl = db.collection(name) as any;
            await movementColl.bulkWrite(movementDocs.map(m => ({
              updateOne: { filter: { _id: m._id }, update: { $setOnInsert: m }, upsert: true }
            })), { ordered: true, session });
          }
        }

        const repairOps = repairs.map(({sku, changes}) => ({ updateOne: { filter: {sku}, update: {$set: {...changes, updatedAt: now}} } }));
        if (repairOps.length) await coll.bulkWrite(repairOps, { ordered: true, session });
        await coll.updateOne({ sku: 'DAIR-MIL-008' }, { $set: {
          name: 'PARAM Skimmed Milk Powder', description: 'Param branded skimmed milk powder as shown in the product image.',
          unit: 'pack', updatedAt: now
        } }, { session });
        const milk = await coll.findOne({sku:'DAIR-MIL-008'}, {session});
        if (milk?.imageUrl?.startsWith('data:image/')) {
          const [, encoded] = milk.imageUrl.split(',', 2);
          const result = await cloudinaryService.upload(Buffer.from(encoded, 'base64'), 'PARAM-Skimmed-Milk-Powder', 'image/jpeg');
          const verify = await fetch(result.url);
          if (!verify.ok || !verify.headers.get('content-type')?.startsWith('image/')) throw new Error('Milk product Cloudinary image verification failed.');
          assetsToCleanup.push(result.publicId);
          await coll.updateOne({sku:'DAIR-MIL-008'}, {$set: {imageUrl:result.url,imagePublicId:result.publicId,imageCredit:'Product package photo',updatedAt:now}}, {session});
        }
        await coll.updateMany({sku:{$in:retireSkus}}, {$set:{isActive:false,updatedAt:now}}, {session});
      });
    } finally { await session.endSession(); }
  } catch (error) {
    await Promise.allSettled(assetsToCleanup.map(id => cloudinaryService.delete(id)));
    throw error;
  }

  const final = await coll.find({ isActive: true, category: { $ne: 'Testing' } }).toArray();
  const bad = final.filter(p => !p.name?.trim() || !p.sku?.trim() || !p.category?.trim() || !(p.sellingPrice > 0) || !(p.availableStock >= 0) || !p.description?.trim() || !p.imageUrl?.startsWith('https://res.cloudinary.com/'));
  const skuDuplicates = await coll.aggregate([{ $group: {_id:'$sku',count:{$sum:1}} }, {$match:{count:{$gt:1}}}]).toArray();
  const duplicateNames = await coll.aggregate([
    {$match:{isActive:true,category:{$ne:'Testing'}}},
    {$group:{_id:{$toLower:{$trim:{input:'$name'}}},count:{$sum:1},skus:{$push:'$sku'}}},
    {$match:{count:{$gt:1}}}
  ]).toArray();
  console.log(JSON.stringify({database:db.databaseName,added:staged.length,skippedExisting:skipped,retired:retireSkus.length,activePublicProducts:final.length,invalidPublicProducts:bad.length,duplicateSkus:skuDuplicates.length,duplicateNames:duplicateNames.length,cloudinaryUploads:assetsToCleanup.length},null,2));
  if (final.length < 60 || bad.length || skuDuplicates.length || duplicateNames.length) throw new Error('Post-seed catalog validation failed.');
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exitCode = 1; }).finally(async () => { await mongoose.disconnect(); });
