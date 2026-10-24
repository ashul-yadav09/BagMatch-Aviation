import { Router, Request, Response } from 'express';
import { db } from '../db/db.ts';
import { AuthService } from '../services/authService.ts';
import { AuditService } from '../services/auditService.ts';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.ts';
import { User, UserRole } from '../db/types.ts';

export const authRouter = Router();

// POST /api/v1/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: email.trim().toLowerCase(),
      password_hash: AuthService.hashPassword(password),
      full_name: full_name.trim(),
      role: 'passenger', // Strictly passenger by default!
      phone: phone ? phone.trim() : undefined,
      created_at: now,
      updated_at: now,
    };

    db.createUser(newUser);

    const token = AuthService.generateToken(newUser);
    const sanitized = AuthService.sanitizeUser(newUser);

    AuditService.logAction({
      userId: newUser.id,
      userEmail: newUser.email,
      userRole: newUser.role,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: newUser.id,
      details: { role: newUser.role },
      ipAddress: req.ip,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: sanitized,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const isMatch = AuthService.verifyPassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const token = AuthService.generateToken(user);
    const sanitized = AuthService.sanitizeUser(user);

    AuditService.logAction({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      details: { role: user.role },
      ipAddress: req.ip,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.json({
      success: true,
      user: sanitized,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
  const user = db.getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, user: AuthService.sanitizeUser(user) });
});

// PUT /api/v1/auth/profile
authRouter.put('/profile', authenticateToken, (req: Request, res: Response) => {
  const { full_name, phone } = req.body;
  const updated = db.updateUser(req.user!.userId, {
    ...(full_name ? { full_name: full_name.trim() } : {}),
    ...(phone !== undefined ? { phone: phone.trim() } : {}),
  });

  if (!updated) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  AuditService.logAction({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'PROFILE_UPDATED',
    entityType: 'user',
    entityId: req.user!.userId,
    details: { fields: Object.keys(req.body) },
    ipAddress: req.ip,
  });

  res.json({ success: true, user: AuthService.sanitizeUser(updated) });
});

// Admin routes: Manage users
authRouter.get('/users', authenticateToken, requireRole('admin'), (_req: Request, res: Response) => {
  const users = db.getUsers().map((u) => AuthService.sanitizeUser(u));
  res.json({ success: true, users });
});

authRouter.put('/users/:id/role', authenticateToken, requireRole('admin'), (req: Request, res: Response) => {
  const { role } = req.body;
  const targetId = req.params.id;

  if (!['passenger', 'staff', 'admin'].includes(role)) {
    res.status(400).json({ success: false, error: 'Invalid role' });
    return;
  }

  const updated = db.updateUser(targetId, { role: role as UserRole });
  if (!updated) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  AuditService.logAction({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'USER_ROLE_CHANGED',
    entityType: 'user',
    entityId: targetId,
    details: { newRole: role, targetUser: updated.email },
    ipAddress: req.ip,
  });

  res.json({ success: true, user: AuthService.sanitizeUser(updated) });
});
