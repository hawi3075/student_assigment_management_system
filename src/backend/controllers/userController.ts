import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, getMemoryStore, logActivity } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { full_name, department, bio } = req.body;
  const userId = req.user!.id;
  const pool = db.getPool();

  try {
    if (pool) {
      const result = await pool.query(
        `UPDATE users 
         SET full_name = COALESCE($1, full_name),
             department = COALESCE($2, department),
             bio = COALESCE($3, bio),
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, full_name, email, role, is_active, department, bio, updated_at`,
        [full_name, department, bio, userId]
      );
      await logActivity(userId, 'PROFILE_UPDATED', `${req.user!.full_name} updated their profile.`);
      res.json({ success: true, message: 'Profile updated successfully.', user: result.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    const user = memory.users.find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    if (full_name) user.full_name = full_name;
    if (department !== undefined) user.department = department;
    if (bio !== undefined) user.bio = bio;
    user.updated_at = new Date().toISOString();

    await logActivity(userId, 'PROFILE_UPDATED', `${user.full_name} updated their profile.`);
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, message: 'Profile updated successfully.', user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAdminUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { role, search, is_active } = req.query;
  const pool = db.getPool();

  try {
    if (pool) {
      let query = `SELECT id, full_name, email, role, is_active, department, created_at FROM users WHERE 1=1`;
      const params: any[] = [];

      if (role) {
        params.push(role);
        query += ` AND role = $${params.length}`;
      }
      if (is_active !== undefined) {
        params.push(is_active === 'true');
        query += ` AND is_active = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        query += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
      }

      query += ` ORDER BY id ASC`;
      const result = await pool.query(query, params);
      res.json({ success: true, users: result.rows });
      return;
    }

    const memory = getMemoryStore();
    let users = memory.users.map(({ password_hash, ...u }) => u);

    if (role) {
      users = users.filter(u => u.role === role);
    }
    if (is_active !== undefined) {
      const activeBool = is_active === 'true';
      users = users.filter(u => u.is_active === activeBool);
    }
    if (search) {
      const q = String(search).toLowerCase();
      users = users.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { is_active } = req.body;
  const targetId = parseInt(id);
  const caller = req.user!;

  if (targetId === caller.id) {
    res.status(400).json({ success: false, error: 'You cannot deactivate your own account.' });
    return;
  }

  const pool = db.getPool();
  try {
    if (pool) {
      const targetCheck = await pool.query('SELECT role, full_name FROM users WHERE id = $1', [targetId]);
      if (targetCheck.rows.length === 0) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }
      const targetUser = targetCheck.rows[0];

      if ((targetUser.role === 'admin' || targetUser.role === 'super_admin') && caller.role !== 'super_admin') {
        res.status(403).json({ success: false, error: 'Permission denied. Only Super Administrators can modify Administrator accounts.' });
        return;
      }

      const result = await pool.query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, is_active, role',
        [is_active, targetId]
      );
      await logActivity(caller.id, 'USER_STATUS_CHANGED', `Changed user #${targetId} (${targetUser.full_name}) status to ${is_active}.`);
      res.json({ success: true, message: `User status updated to ${is_active ? 'active' : 'inactive'}.`, user: result.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    const user = memory.users.find(u => u.id === targetId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    if ((user.role === 'admin' || user.role === 'super_admin') && caller.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Permission denied. Only Super Administrators can modify Administrator accounts.' });
      return;
    }

    user.is_active = is_active;
    user.updated_at = new Date().toISOString();
    await logActivity(caller.id, 'USER_STATUS_CHANGED', `Changed user #${targetId} (${user.full_name}) status to ${is_active}.`);

    res.json({ success: true, message: `User status updated to ${is_active ? 'active' : 'inactive'}.`, user: { id: user.id, full_name: user.full_name, is_active: user.is_active, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createAdminUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { full_name, email, password, role, department } = req.body;
  const caller = req.user!;
  const pool = db.getPool();

  if (!full_name || !email || !password || !role) {
    res.status(400).json({ success: false, error: 'All fields are required.' });
    return;
  }

  // Only super_admin can create admin or super_admin accounts
  if ((role === 'admin' || role === 'super_admin') && caller.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      error: 'Permission denied. Only Super Administrators can provision Administrator or Super Administrator accounts.'
    });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (pool) {
      const exists = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (exists.rows.length > 0) {
        res.status(400).json({ success: false, error: 'User with this email already exists.' });
        return;
      }

      const insert = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, is_active, department)
         VALUES ($1, $2, $3, $4, true, $5)
         RETURNING id, full_name, email, role, is_active, department`,
        [full_name.trim(), normalizedEmail, password_hash, role, department || null]
      );
      await logActivity(req.user!.id, 'ADMIN_CREATED_USER', `Administrator created new ${role}: ${full_name}`);
      res.status(201).json({ success: true, user: insert.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    if (memory.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      res.status(400).json({ success: false, error: 'User with this email already exists.' });
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
    await logActivity(req.user!.id, 'ADMIN_CREATED_USER', `Administrator created new ${role}: ${full_name}`);

    const { password_hash: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Secure Bootstrap Administrator Procedure (Section 7 requirement)
export async function bootstrapAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { bootstrap_key, full_name, email, password } = req.body;
  const expectedKey = process.env.ADMIN_BOOTSTRAP_KEY || 'unitask_admin_bootstrap_key_2026';

  if (bootstrap_key !== expectedKey) {
    res.status(403).json({ success: false, error: 'Invalid administrator bootstrap authorization key.' });
    return;
  }

  const normalizedEmail = (email || 'admin@university.edu').trim().toLowerCase();
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password || 'Admin@123', salt);

  const pool = db.getPool();
  try {
    if (pool) {
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (existing.rows.length > 0) {
        await pool.query('UPDATE users SET role = $1, password_hash = $2, is_active = true WHERE id = $3', ['admin', password_hash, existing.rows[0].id]);
        res.json({ success: true, message: 'Existing account upgraded to Administrator successfully.' });
        return;
      }
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, is_active, department)
         VALUES ($1, $2, $3, 'admin', true, 'System Administration')`,
        [full_name || 'System Administrator', normalizedEmail, password_hash]
      );
      res.json({ success: true, message: 'Primary Administrator bootstrapped successfully.' });
      return;
    }

    const memory = getMemoryStore();
    const existing = memory.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      existing.role = 'admin';
      existing.password_hash = password_hash;
      existing.is_active = true;
      res.json({ success: true, message: 'Existing account upgraded to Administrator successfully.' });
      return;
    }

    memory.users.push({
      id: memory.sequences.users++,
      full_name: full_name || 'System Administrator',
      email: normalizedEmail,
      password_hash,
      role: 'admin',
      is_active: true,
      department: 'System Administration',
      bio: 'Bootstrapped Primary Administrator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Primary Administrator bootstrapped successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
