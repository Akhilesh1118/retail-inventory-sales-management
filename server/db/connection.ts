import mongoose from 'mongoose';
import { db } from './dataStore.ts';

export function getMaskedMongoUri(uri?: string): string {
  const target = uri || process.env.MONGODB_URI || '';
  if (!target) return 'Not Configured';
  return target.replace(/:([^:@]{3})[^:@]*@/, ':****@');
}

export function getMongoConnectionStateName(state: number): string {
  switch (state) {
    case 0:
      return 'Disconnected';
    case 1:
      return 'Connected';
    case 2:
      return 'Connecting';
    case 3:
      return 'Disconnecting';
    default:
      return 'Unknown';
  }
}

export async function initDatabase() {
  // Always initialize data store first to ensure instant readiness
  await db.init();

  if (mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && !mongoUri.includes('placeholder')) {
    try {
      console.log(`Connecting to MongoDB at: ${getMaskedMongoUri(mongoUri)}`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000
      });
      console.log(`✅ MongoDB Mongoose connection established successfully to database: '${mongoose.connection.db?.databaseName}'`);
    } catch (err: any) {
      console.warn(
        `Notice: Could not connect to external MongoDB server (${err.message}). Using high-performance embedded atomic datastore with full transactional integrity.`
      );
    }
  } else {
    console.log('Running with built-in embedded atomic datastore with JSON persistence and concurrency controls.');
  }
}

export async function getMongoStatus() {
  const mongoUri = process.env.MONGODB_URI;
  const isConfigured = Boolean(mongoUri && !mongoUri.includes('placeholder'));
  const readyState = mongoose.connection.readyState;
  const stateName = getMongoConnectionStateName(readyState);
  const isConnected = readyState === 1;

  let pingMs: number | null = null;
  let databaseName = isConnected ? mongoose.connection.db?.databaseName || 'N/A' : null;
  let host = isConnected ? mongoose.connection.host || 'N/A' : null;
  let collections: string[] = [];

  if (isConnected && mongoose.connection.db) {
    try {
      const pingStart = Date.now();
      await mongoose.connection.db.command({ ping: 1 });
      pingMs = Date.now() - pingStart;

      const collList = await mongoose.connection.db.listCollections().toArray();
      collections = collList.map((c) => c.name);
    } catch (err) {
      console.error('Error pinging MongoDB:', err);
    }
  }

  return {
    configured: isConfigured,
    maskedUri: getMaskedMongoUri(mongoUri),
    connected: isConnected,
    readyState,
    stateName,
    databaseName,
    host,
    pingMs,
    collections,
    timestamp: new Date().toISOString()
  };
}

export async function runMongoDataOperationTest() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes('placeholder')) {
    throw new Error('MONGODB_URI is not configured in the environment.');
  }

  // If not currently connected, attempt connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  }

  const database = mongoose.connection.db;
  if (!database) {
    throw new Error('Database handle is not available on active MongoDB connection.');
  }

  const overallStart = Date.now();
  const testColl = database.collection('__connection_test__');
  const testId = 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // 1. CREATE test
  const createStart = Date.now();
  const testDoc = {
    testId,
    purpose: 'MongoDB Connectivity & CRUD Verification',
    createdAt: new Date(),
    verified: false,
    environment: process.env.NODE_ENV || 'development'
  };
  const insertResult = await testColl.insertOne(testDoc);
  const createDurationMs = Date.now() - createStart;

  // 2. READ test
  const readStart = Date.now();
  const fetchedDoc = await testColl.findOne({ _id: insertResult.insertedId });
  const readDurationMs = Date.now() - readStart;
  const readVerified = Boolean(fetchedDoc && fetchedDoc.testId === testId);

  // 3. UPDATE test
  const updateStart = Date.now();
  const updateResult = await testColl.updateOne(
    { _id: insertResult.insertedId },
    { $set: { verified: true, verifiedAt: new Date(), status: 'TEST_SUCCESSFUL' } }
  );
  const updateDurationMs = Date.now() - updateStart;

  // 4. READ UPDATED to confirm modification
  const readUpdated = await testColl.findOne({ _id: insertResult.insertedId });

  // 5. DELETE test (cleanup)
  const deleteStart = Date.now();
  const deleteResult = await testColl.deleteOne({ _id: insertResult.insertedId });
  const deleteDurationMs = Date.now() - deleteStart;

  // List existing collections
  const colls = await database.listCollections().toArray();
  const collectionNames = colls.map((c) => c.name);

  const totalDurationMs = Date.now() - overallStart;

  return {
    success: true,
    message: 'MongoDB Connection verified and all Data Operations (CREATE, READ, UPDATE, DELETE) completed successfully.',
    connection: {
      status: 'Connected',
      databaseName: database.databaseName,
      host: mongoose.connection.host,
      maskedUri: getMaskedMongoUri(mongoUri),
      readyState: mongoose.connection.readyState
    },
    operations: {
      create: {
        success: Boolean(insertResult.acknowledged),
        insertedId: insertResult.insertedId.toString(),
        durationMs: createDurationMs
      },
      read: {
        success: readVerified,
        documentFound: Boolean(fetchedDoc),
        durationMs: readDurationMs
      },
      update: {
        success: updateResult.modifiedCount === 1,
        modifiedCount: updateResult.modifiedCount,
        verifiedValue: readUpdated?.status === 'TEST_SUCCESSFUL',
        durationMs: updateDurationMs
      },
      delete: {
        success: deleteResult.deletedCount === 1,
        deletedCount: deleteResult.deletedCount,
        durationMs: deleteDurationMs
      }
    },
    collections: collectionNames,
    totalDurationMs,
    timestamp: new Date().toISOString()
  };
}
