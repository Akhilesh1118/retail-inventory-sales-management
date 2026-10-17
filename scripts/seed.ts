import { db } from '../server/db/dataStore.ts';

async function runSeed() {
  console.log('--- Initializing RetailFlow Database & Demo Records ---');
  await db.init();
  console.log('Database initialized successfully.');
  console.log('Default credentials:');
  console.log('  Admin: username="admin", password="Admin123!"');
  console.log('  Staff: username="staff", password="Staff123!"');
  console.log('Products seeded:', db.getProducts({ limit: 100 }).total);
  console.log('Movements logged:', db.getMovements({ limit: 100 }).total);
  console.log('Sales transactions:', db.getSales({ limit: 100 }).total);
  process.exit(0);
}

runSeed().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
