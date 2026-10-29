import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, getMemoryStore } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'unitask_secure_jwt_dev_token_2026_xyz987';

export interface AuthUser {
  id: number;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  full_name: string;
  is_active: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: { id: number; email: string; role: string; full_name: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Fallback to cookie if present
  if (!token && req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    if (cookies.token) {
      token = cookies.token;
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required. Please log in.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Validate that user still exists and is active
    let userRecord: AuthUser | null = null;
    const pool = db.getPool();

    if (pool) {
      const result = await pool.query('SELECT id, email, role, full_name, is_active FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length > 0) {
        userRecord = result.rows[0];
      }
    } else {
      const memory = getMemoryStore();
      const user = memory.users.find(u => u.id === decoded.id);
      if (user) {
        userRecord = {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          is_active: user.is_active
        };
      }
    }

    if (!userRecord) {
      res.status(401).json({ success: false, error: 'User account not found.' });
      return;
    }

    if (!userRecord.is_active) {
      res.status(403).json({ success: false, error: 'Your university account has been deactivated. Contact an administrator.' });
      return;
    }

    req.user = userRecord;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication session. Please log in again.'
    });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. This resource requires ${allowedRoles.join(' or ')} privileges.`
      });
      return;
    }

    next();
  };
}
