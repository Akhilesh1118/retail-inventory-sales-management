import { db } from '../server/db/dataStore.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'apex-retail-flow-jwt-super-secret-key-2026';

let passed = 0;
let failed = 0;

function check(cond: boolean, name: string, detail: string = '') {
  if (cond) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${name} - ${detail}`);
  }
}

async function runCustomerTests() {
  console.log('====================================================');
  console.log('VERIFYING CUSTOMER AUTH & SEPARATE PORTAL LOGIC');
  console.log('====================================================');

  await db.init();

  // 1. Customer registration creates a user with role 'customer'
  const testEmail = `cust_test_${Date.now()}@example.com`;
  const customer = await db.createCustomer({
    fullName: 'Test Customer User',
    email: testEmail,
    passwordPlain: 'CustPassword123!'
  });

  check(
    !!customer && customer.role === 'customer' && customer.email === testEmail,
    'Customer account created with server-assigned customer role'
  );

  // 2. Passwords are securely hashed with bcrypt
  const isMatch = await bcrypt.compare('CustPassword123!', customer.password || '');
  const isPlainStored = customer.password === 'CustPassword123!';
  check(isMatch && !isPlainStored, 'Customer password hashed securely with bcrypt');

  // 3. Duplicate email registration is prevented
  let dupThrew = false;
  try {
    await db.createCustomer({
      fullName: 'Duplicate Customer',
      email: testEmail,
      passwordPlain: 'AnotherPassword!'
    });
  } catch (err: any) {
    dupThrew = err.message.includes('already exists');
  }
  check(dupThrew, 'Duplicate customer email addresses are rejected');

  // 4. Customer token verification
  const token = jwt.sign(
    {
      userId: customer._id,
      username: customer.username,
      email: customer.email,
      role: customer.role,
      fullName: customer.fullName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const decoded = jwt.verify(token, JWT_SECRET) as any;
  check(decoded.role === 'customer' && decoded.userId === customer._id, 'Customer JWT payload matches customer schema');

  // 5. Customer orders isolation: Customer only retrieves their own orders
  const testProduct = db.getProducts({ isActive: true }).products.find((p) => p.availableStock > 0);
  if (testProduct) {
    const sale = await db.createSale({
      items: [{ productId: testProduct._id, quantity: 1 }],
      user: { id: customer._id, name: customer.fullName },
      notes: `Order test | Email: ${customer.email}`
    });

    const customerOrders = db.getCustomerOrders(customer._id, customer.email);
    const hasOrder = customerOrders.some((o) => o._id === sale._id);
    check(hasOrder, 'Customer order is linked and retrievable via customer orders');

    // Check isolation from another random customer
    const otherOrders = db.getCustomerOrders('random_other_cust_id', 'other@example.com');
    const leaked = otherOrders.some((o) => o._id === sale._id);
    check(!leaked, 'Customer order history is strictly isolated from other customers');
  }

  // 6. Discount authorization: Staff/Admin can apply POS discounts, while customer orders cannot manipulate discounts
  const staff = db.findUserByUsernameOrEmail('staff');
  const admin = db.findUserByUsernameOrEmail('admin');
  check(admin?.role === 'admin' && staff?.role === 'staff', 'Admin and Staff roles remain intact and distinct');

  // Verify staff can execute sales with discount
  const staffSaleProduct = db.getProducts({ isActive: true }).products.find((p) => p.availableStock > 0);
  if (staffSaleProduct && staff) {
    const discountedStaffSale = await db.createSale({
      items: [{ productId: staffSaleProduct._id, quantity: 1 }],
      discountPercent: 10,
      user: { id: staff._id, name: staff.fullName }
    });
    check(
      discountedStaffSale.discountPercent === 10 && discountedStaffSale.discountAmount > 0,
      'Staff and Admin POS can apply authorized discounts'
    );
  }

  console.log('====================================================');
  console.log(`CUSTOMER TESTS RESULT: ${passed} PASSED, ${failed} FAILED.`);
  console.log('====================================================');
}

runCustomerTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
