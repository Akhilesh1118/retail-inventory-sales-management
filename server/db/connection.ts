import mongoose from 'mongoose';
import { db } from './dataStore.ts';

export function getMaskedMongoUri(uri?: string): string {
  const target = uri || process.env.MONGODB_URI || '';
  if (!target) return 'Not Configured';
  return target.replace(/:([^:@]{3})[^:@]*@/, ':****@');
}

export async function initDatabase(): Promise<void> {
  await db.init();

  if (mongoose.connection.readyState !== 1) {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && !/placeholder|replace-with/i.test(mongoUri)) {
      try {
        console.log(`Connecting to MongoDB at: ${getMaskedMongoUri(mongoUri)}`);
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 4000,
          connectTimeoutMS: 4000
        });
        console.log(`Connected to MongoDB database '${mongoose.connection.db?.databaseName}'.`);
        await db.syncFromMongo();
      } catch (err: any) {
        console.warn(
          `MongoDB connection unavailable (${err.message}); using the local JSON datastore.`
        );
      }
    } else {
      console.log('Using the local JSON datastore.');
    }
  } else {
    await db.syncFromMongo();
  }

  await db.ensureInitialAdminFromEnvironment();
}
