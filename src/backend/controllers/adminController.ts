import { Response } from 'express';
import { db, getMemoryStore, getDbStatus } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pool = db.getPool();

  try {
    if (pool) {
      const [usersCount, coursesCount, assignmentsCount, submissionsCount, gradesCount] = await Promise.all([
        pool.query(`SELECT 
          COUNT(*) FILTER (WHERE role = 'student') as students,
          COUNT(*) FILTER (WHERE role = 'teacher') as teachers,
          COUNT(*) FILTER (WHERE role = 'admin') as admins
          FROM users`),
        pool.query('SELECT COUNT(*) as count FROM courses'),
        pool.query('SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE status = \'published\') as published FROM assignments'),
        pool.query('SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE is_late = true) as late FROM submissions'),
        pool.query('SELECT COUNT(*) as count, AVG(marks_obtained) as avg_marks FROM grades WHERE published_at IS NOT NULL')
      ]);

      res.json({
        success: true,
        stats: {
          students: parseInt(usersCount.rows[0].students) || 0,
          teachers: parseInt(usersCount.rows[0].teachers) || 0,
          admins: parseInt(usersCount.rows[0].admins) || 0,
          courses: parseInt(coursesCount.rows[0].count) || 0,
          assignments: parseInt(assignmentsCount.rows[0].count) || 0,
          published_assignments: parseInt(assignmentsCount.rows[0].published) || 0,
          submissions: parseInt(submissionsCount.rows[0].count) || 0,
          late_submissions: parseInt(submissionsCount.rows[0].late) || 0,
          grades: parseInt(gradesCount.rows[0].count) || 0,
          avg_score: parseFloat(gradesCount.rows[0].avg_marks || 0).toFixed(1)
        }
      });
      return;
    }

    const memory = getMemoryStore();
    const students = memory.users.filter(u => u.role === 'student').length;
    const teachers = memory.users.filter(u => u.role === 'teacher').length;
    const admins = memory.users.filter(u => u.role === 'admin').length;
    const courses = memory.courses.length;
    const assignments = memory.assignments.length;
    const published = memory.assignments.filter(a => a.status === 'published').length;
    const submissions = memory.submissions.length;
    const late = memory.submissions.filter(s => s.is_late).length;
    const publishedGrades = memory.grades.filter(g => g.published_at !== null);
    const avgScore = publishedGrades.length > 0
      ? (publishedGrades.reduce((sum, g) => sum + g.marks_obtained, 0) / publishedGrades.length).toFixed(1)
      : '0.0';

    res.json({
      success: true,
      stats: {
        students,
        teachers,
        admins,
        courses,
        assignments,
        published_assignments: published,
        submissions,
        late_submissions: late,
        grades: publishedGrades.length,
        avg_score: avgScore
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pool = db.getPool();

  try {
    if (pool) {
      const result = await pool.query(
        `SELECT l.*, u.full_name as user_name, u.email as user_email, u.role as user_role
         FROM activity_logs l
         LEFT JOIN users u ON l.user_id = u.id
         ORDER BY l.created_at DESC
         LIMIT 100`
      );
      res.json({ success: true, logs: result.rows });
      return;
    }

    const memory = getMemoryStore();
    const logs = memory.activity_logs.slice(0, 100).map(l => {
      const user = memory.users.find(u => u.id === l.user_id);
      return {
        ...l,
        user_name: user?.full_name || 'System',
        user_email: user?.email || '',
        user_role: user?.role || 'system'
      };
    });

    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getSystemHealth(_req: any, res: Response): Promise<void> {
  const dbStatus = getDbStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: {
      type: dbStatus.type,
      connected: dbStatus.connected,
      message: dbStatus.message,
      neon_project_id: 'empty-wave-35284158',
      neon_org_id: 'org-aged-queen-84768675',
      neon_branch: 'production'
    }
  });
}
