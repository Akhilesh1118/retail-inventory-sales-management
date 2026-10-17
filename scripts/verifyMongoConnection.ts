import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function runVerification() {
  console.log('\n======================================================');
  console.log('    RETAILFLOW MONGODB CONNECTION & DATA TEST SUITE   ');
  console.log('======================================================\n');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ FAILED: MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  const maskedUri = uri.replace(/:([^:@]{3})[^:@]*@/, ':****@');
  console.log(`📡 MongoDB Target: ${maskedUri}`);

  // Step 1: Test Connection
  console.log('\n--- STEP 1: ESTABLISHING CONNECTION ---');
  const connStart = Date.now();
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });
    const connDuration = Date.now() - connStart;
    console.log(`✅ MongoDB Connection Successful! (Handshake time: ${connDuration}ms)`);
    console.log(`   - Connection ReadyState: ${mongoose.connection.readyState} (1 = Connected)`);
    console.log(`   - Database Name: ${mongoose.connection.db?.databaseName}`);
    console.log(`   - Host: ${mongoose.connection.host}`);
  } catch (err: any) {
    console.error(`❌ Connection failed: ${err.message}`);
    process.exit(1);
  }

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ Fatal: Database reference is undefined');
    process.exit(1);
  }

  // Step 2: Ping Test
  console.log('\n--- STEP 2: DATABASE PING ---');
  const pingStart = Date.now();
  const pingResult = await db.command({ ping: 1 });
  const pingMs = Date.now() - pingStart;
  console.log(`✅ Ping Response: ok=${pingResult.ok} (Roundtrip latency: ${pingMs}ms)`);

  // Step 3: CRUD Data Operations
  console.log('\n--- STEP 3: TESTING DATA OPERATIONS (CRUD) ---');
  const testColl = db.collection('__connection_test__');
  const testDocId = 'test_verify_' + Date.now();

  // 3a. CREATE / INSERT
  const createStart = Date.now();
  const insertDoc = {
    testId: testDocId,
    testName: 'Automated CRUD Verification',
    createdAt: new Date(),
    status: 'PENDING',
    details: {
      client: 'RetailFlow Verification Suite',
      platform: process.platform,
      nodeVersion: process.version
    }
  };
  const insertRes = await testColl.insertOne(insertDoc);
  const createMs = Date.now() - createStart;
  console.log(`✅ 1. [CREATE / INSERT] Passed: Inserted Document ID: ${insertRes.insertedId} (${createMs}ms)`);

  // 3b. READ / QUERY
  const readStart = Date.now();
  const fetchedDoc = await testColl.findOne({ _id: insertRes.insertedId });
  const readMs = Date.now() - readStart;
  if (!fetchedDoc || fetchedDoc.testId !== testDocId) {
    console.error('❌ [READ / QUERY] Failed: Document not found or corrupted');
    process.exit(1);
  }
  console.log(`✅ 2. [READ / QUERY] Passed: Document verified by ObjectId (${readMs}ms)`);

  // 3c. UPDATE
  const updateStart = Date.now();
  const updateRes = await testColl.updateOne(
    { _id: insertRes.insertedId },
    { $set: { status: 'VERIFIED_SUCCESSFUL', verifiedAt: new Date(), updateAcknowledged: true } }
  );
  const updateMs = Date.now() - updateStart;
  if (updateRes.modifiedCount !== 1) {
    console.error(`❌ [UPDATE] Failed: Expected modifiedCount 1, got ${updateRes.modifiedCount}`);
    process.exit(1);
  }
  console.log(`✅ 3. [UPDATE] Passed: Modified 1 document successfully (${updateMs}ms)`);

  // 3d. DELETE (CLEANUP)
  const deleteStart = Date.now();
  const deleteRes = await testColl.deleteOne({ _id: insertRes.insertedId });
  const deleteMs = Date.now() - deleteStart;
  if (deleteRes.deletedCount !== 1) {
    console.error(`❌ [DELETE] Failed: Expected deletedCount 1, got ${deleteRes.deletedCount}`);
    process.exit(1);
  }
  console.log(`✅ 4. [DELETE] Passed: Cleaned up test document. Deleted count: 1 (${deleteMs}ms)`);

  // Step 4: Database Collections
  console.log('\n--- STEP 4: ENUMERATING COLLECTIONS ---');
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);
  console.log(`✅ Collections found in database '${db.databaseName}':`, collectionNames);

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log(' 🎉 RESULT: MONGODB CONNECTION & DATA OPERATIONS VERIFIED!');
  console.log('    All CRUD checks passed with zero errors.');
  console.log('======================================================\n');
}

runVerification().catch((err) => {
  console.error('Verification failed with uncaught exception:', err);
  process.exit(1);
});
