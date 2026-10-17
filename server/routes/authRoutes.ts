import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/dataStore.ts';
import { generateToken, authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, username, email, password } = req.body;
    const loginId = identifier || username || email;

    if (!loginId || !password) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Username/email and password are required.'
      });
      return;
    }

    const user = db.findUserByUsernameOrEmail(loginId);
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username/email or password.'
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This user account has been deactivated. Please contact an administrator.'
      });
      return;
    }

    if (user.role === 'customer') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This portal is restricted to Store Staff & Administrators. Please sign in via the customer portal.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username/email or password.'
      });
      return;
    }

    const token = generateToken({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'NotFound', message: 'User not found.' });
    return;
  }

  if (user.role === 'customer') {
    res.status(403).json({ error: 'Forbidden', message: 'Customer accounts must use customer portal endpoints.' });
    return;
  }

  res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  });
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/auth/init-admin (Safe initialization of initial administrator if none exists or bootstrap)
router.post('/init-admin', async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password || !fullName) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'username, email, password, and fullName are required.'
      });
      return;
    }

    const existingUsers = db.getAllUsers();
    const hasAdmin = existingUsers.some((u) => u.role === 'admin' && u.isActive);

    if (hasAdmin) {
      res.status(409).json({
        error: 'Conflict',
        message: 'An active Administrator account already exists. Use the user management panel or sign in.'
      });
      return;
    }

    const admin = await db.createFirstAdmin(username, email, password, fullName);
    res.status(201).json({
      message: 'Initial Administrator account created successfully.',
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        fullName: admin.fullName
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/users (Admin only)
router.get('/users', authenticateToken, requireAdmin, (_req, res) => {
  const users = db.getAllUsers().map((u) => ({
    id: u._id,
    _id: u._id,
    username: u.username,
    email: u.email,
    role: u.role,
    fullName: u.fullName,
    isActive: u.isActive,
    createdAt: u.createdAt
  }));
  res.json({ users });
});

// POST /api/auth/users (Admin only: create user)
router.post('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { username, email, password, role, fullName } = req.body;

    if (!username || !email || !password || !role || !fullName) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'username, email, password, role, and fullName are required.'
      });
      return;
    }

    if (role !== 'admin' && role !== 'staff') {
      res.status(400).json({
        error: 'BadRequest',
        message: "Role must be either 'admin' or 'staff'."
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    const newUser = await db.createUser({
      username,
      email,
      passwordPlain: password,
      role,
      fullName
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: safeUser._id,
        _id: safeUser._id,
        username: safeUser.username,
        email: safeUser.email,
        role: safeUser.role,
        fullName: safeUser.fullName,
        isActive: safeUser.isActive,
        createdAt: safeUser.createdAt
      }
    });
  } catch (err: any) {
    if (err.message && err.message.includes('already')) {
      res.status(409).json({ error: 'Conflict', message: err.message });
      return;
    }
    next(err);
  }
});

// PATCH /api/auth/users/:id (Admin only: toggle role / active status)
router.patch('/users/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    if (role && role !== 'admin' && role !== 'staff') {
      res.status(400).json({ error: 'BadRequest', message: "Role must be 'admin' or 'staff'." });
      return;
    }

    const updated = db.updateUserRole(id, role, isActive);
    const { password: _, ...safeUser } = updated;
    res.json({
      message: 'User updated successfully.',
      user: {
        id: safeUser._id,
        _id: safeUser._id,
        username: safeUser.username,
        email: safeUser.email,
        role: safeUser.role,
        fullName: safeUser.fullName,
        isActive: safeUser.isActive,
        createdAt: safeUser.createdAt
      }
    });
  } catch (err: any) {
    if (err.message === 'User not found') {
      res.status(404).json({ error: 'NotFound', message: err.message });
      return;
    }
    next(err);
  }
});

export default router;
