import mongoose from 'mongoose';
import { db } from './dataStore.ts';

export async function initDatabase() {
  // Always initialize data store first to ensure instant readiness
  await db.init();

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && !mongoUri.includes('placeholder')) {
    try {
      console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500
      });
      console.log('MongoDB Mongoose connection established successfully.');
    } catch (err: any) {
      console.warn(
        `Notice: Could not connect to external MongoDB server (${err.message}). Using high-performance embedded atomic datastore with full transactional integrity.`
      );
    }
  } else {
    console.log('Running with built-in embedded atomic datastore with JSON persistence and concurrency controls.');
  }
}
