import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, getMemoryStore, logActivity } from '../config/database.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { full_name, email, password, role, department } = req.body;

  if (!full_name || !email || !password || !role) {
    res.status(400).json({ success: false, error: 'Full name, email, password, and role are required.' });
    return;
  }

  // Prevent registration as admin
  if (role !== 'student' && role !== 'teacher') {
    res.status(400).json({ success: false, error: 'Public registration allows only "student" or "teacher" roles.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pool = db.getPool();

  try {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    if (pool) {
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (existing.rows.length > 0) {
        res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
        return;
      }

      const insertRes = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, is_active, department)
         VALUES ($1, $2, $3, $4, true, $5)
         RETURNING id, full_name, email, role, is_active, department, created_at`,
        [full_name.trim(), normalizedEmail, password_hash, role, department || null]
      );
      const newUser = insertRes.rows[0];
      const token = generateToken(newUser);
      await logActivity(newUser.id, 'USER_REGISTERED', `New ${role} registered: ${newUser.full_name} (${newUser.email})`);

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        token,
        user: newUser
      });
      return;
    }

    // Local engine fallback
    const memory = getMemoryStore();
    if (memory.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    const newUser = {
      id: memory.sequences.users++,
      full_name: full_name.trim(),
      email: normalizedEmail,
      password_hash,
      role,
      is_active: true,
      department: department || '',
      bio: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memory.users.push(newUser);

    const token = generateToken(newUser);
    await logActivity(newUser.id, 'USER_REGISTERED', `New ${role} registered: ${newUser.full_name} (${newUser.email})`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        is_active: newUser.is_active,
        department: newUser.department,
        created_at: newUser.created_at
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'An error occurred during registration. Please try again.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pool = db.getPool();

  try {
    let user: any = null;

    if (pool) {
      const result = await pool.query(
        'SELECT id, full_name, email, password_hash, role, is_active, department, bio FROM users WHERE LOWER(email) = $1',
        [normalizedEmail]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } else {
      const memory = getMemoryStore();
      user = memory.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, error: 'Your account has been deactivated. Please contact the administrator.' });
      return;
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    await logActivity(user.id, 'USER_LOGIN', `${user.full_name} logged in.`);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        department: user.department,
        bio: user.bio
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const pool = db.getPool();
  try {
    if (pool) {
      const result = await pool.query(
        'SELECT id, full_name, email, role, is_active, department, bio, created_at FROM users WHERE id = $1',
        [req.user.id]
      );
      if (result.rows.length > 0) {
        res.json({ success: true, user: result.rows[0] });
        return;
      }
    } else {
      const memory = getMemoryStore();
      const user = memory.users.find(u => u.id === req.user!.id);
      if (user) {
        const { password_hash, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
        return;
      }
    }
    res.status(404).json({ success: false, error: 'User not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    await logActivity(req.user.id, 'USER_LOGOUT', `${req.user.full_name} logged out.`);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
}
