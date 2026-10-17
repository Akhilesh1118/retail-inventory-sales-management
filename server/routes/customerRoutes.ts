import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { db } from '../db/dataStore.ts';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// POST /api/customer/register - Register a new customer
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      res.status(400).json({ error: 'BadRequest', message: 'Full name is required.' });
      return;
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'BadRequest', message: 'Email address is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({ error: 'BadRequest', message: 'Please provide a valid email address.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'BadRequest', message: 'Password must be at least 6 characters long.' });
      return;
    }

    // Role is strictly assigned by server as 'customer' (preventing privilege escalation)
    const newCustomer = await db.createCustomer({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordPlain: password
    });

    const token = generateToken({
      userId: newCustomer._id,
      username: newCustomer.username,
      email: newCustomer.email,
      role: 'customer',
      fullName: newCustomer.fullName
    });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      customer: {
        id: newCustomer._id,
        fullName: newCustomer.fullName,
        email: newCustomer.email,
        role: newCustomer.role,
        createdAt: newCustomer.createdAt
      }
    });
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      res.status(409).json({ error: 'Conflict', message: err.message });
      return;
    }
    next(err);
  }
});

// POST /api/customer/login - Customer sign in
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Email address and password are required.'
      });
      return;
    }

    const cleanEmail = email.trim();
    const cleanLower = cleanEmail.toLowerCase();
    let user = db.findUserByUsernameOrEmail(cleanLower);

    // If user not yet in memory cache, query MongoDB Atlas directly with case-insensitive regex
    if (!user && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const mongoUser = await mongoose.connection.db.collection('users').findOne({
        $or: [
          { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { username: { $regex: new RegExp(`^${escaped}$`, 'i') } }
        ]
      });
      if (mongoUser) {
        user = {
          _id: mongoUser._id.toString(),
          username: mongoUser.username || mongoUser.email?.split('@')[0] || 'customer',
          email: mongoUser.email || cleanLower,
          password: mongoUser.password,
          role: mongoUser.role || 'customer',
          fullName: mongoUser.fullName || mongoUser.name || mongoUser.username || 'Customer',
          isActive: mongoUser.isActive !== undefined ? mongoUser.isActive : true,
          createdAt: mongoUser.createdAt ? new Date(mongoUser.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: mongoUser.updatedAt ? new Date(mongoUser.updatedAt).toISOString() : new Date().toISOString()
        };
        db.addUserToState(user);
      }
    }

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: `No account found with email '${cleanEmail}'. Please check your email or create an account.`
      });
      return;
    }

    // Ensure customer account
    if (user.role !== 'customer') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This account belongs to Store Staff / Admin. Please use the Staff Portal to log in.'
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This account has been deactivated. Please contact customer support.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Wrong password. Please enter the correct password.'
      });
      return;
    }

    const token = generateToken({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: 'customer',
      fullName: user.fullName
    });

    res.json({
      message: 'Signed in successfully.',
      token,
      customer: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/customer/demo-login - Quick 1-click evaluation access
router.post('/demo-login', async (_req, res, next) => {
  try {
    let customer = db.findUserByUsernameOrEmail('customer@example.com');
    if (!customer) {
      customer = await db.createCustomer({
        fullName: 'Jane Doe',
        email: 'customer@example.com',
        passwordPlain: 'Customer123!'
      });
    }

    const token = generateToken({
      userId: customer._id,
      username: customer.username,
      email: customer.email,
      role: 'customer',
      fullName: customer.fullName
    });

    res.json({
      message: 'Signed in as demo customer.',
      token,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        role: customer.role,
        createdAt: customer.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/customer/me - Get current customer profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'customer') {
    res.status(403).json({ error: 'Forbidden', message: 'Requires customer account.' });
    return;
  }

  let user = db.findUserById(req.user.userId);
  if (!user && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const mongoUser = await mongoose.connection.db.collection('users').findOne({
      $or: [
        { _id: req.user.userId },
        { email: req.user.email?.toLowerCase().trim() }
      ]
    });
    if (mongoUser) {
      user = {
        _id: mongoUser._id.toString(),
        username: mongoUser.username,
        email: mongoUser.email,
        password: mongoUser.password,
        role: mongoUser.role,
        fullName: mongoUser.fullName || mongoUser.name || mongoUser.username,
        isActive: mongoUser.isActive !== undefined ? mongoUser.isActive : true,
        createdAt: mongoUser.createdAt ? new Date(mongoUser.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: mongoUser.updatedAt ? new Date(mongoUser.updatedAt).toISOString() : new Date().toISOString()
      };
      db.addUserToState(user);
    }
  }

  if (!user || !user.isActive) {
    res.status(404).json({ error: 'NotFound', message: 'Customer account not found.' });
    return;
  }

  res.json({
    customer: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

// POST /api/customer/logout
router.post('/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/customer/orders - Get customer's own order history
router.get('/orders', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'customer') {
    res.status(403).json({ error: 'Forbidden', message: 'Requires customer account.' });
    return;
  }

  const orders = db.getCustomerOrders(req.user.userId, req.user.email);
  res.json({ orders });
});

export default router;
