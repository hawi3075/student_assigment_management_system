import { Response } from 'express';
import { db, getMemoryStore, logActivity } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function saveGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
  const submissionId = parseInt(req.params.id);
  const { marks_obtained, feedback, publish } = req.body;
  const user = req.user!;

  if (marks_obtained === undefined || marks_obtained === null || isNaN(parseFloat(marks_obtained))) {
    res.status(400).json({ success: false, error: 'A valid numeric mark is required.' });
    return;
  }

  const marks = parseFloat(marks_obtained);
  if (marks < 0) {
    res.status(400).json({ success: false, error: 'Marks obtained cannot be negative.' });
    return;
  }

  const pool = db.getPool();

  try {
    if (pool) {
      // Check assignment ownership and max marks
      const subRes = await pool.query(
        `SELECT s.*, a.max_marks, a.teacher_id, a.title as assignment_title, u.full_name as student_name
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         JOIN users u ON s.student_id = u.id
         WHERE s.id = $1`,
        [submissionId]
      );

      if (subRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Submission not found.' });
        return;
      }

      const sub = subRes.rows[0];

      if (user.role !== 'admin' && sub.teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Only the assignment instructor can grade this submission.' });
        return;
      }

      if (marks > parseFloat(sub.max_marks)) {
        res.status(400).json({
          success: false,
          error: `Marks obtained (${marks}) cannot exceed the assignment maximum of ${sub.max_marks}.`
        });
        return;
      }

      const published_at = publish ? new Date() : null;

      // Upsert grade
      const existingGrade = await pool.query('SELECT id FROM grades WHERE submission_id = $1', [submissionId]);
      let gradeRecord: any;

      if (existingGrade.rows.length > 0) {
        const updateRes = await pool.query(
          `UPDATE grades
           SET marks_obtained = $1,
               feedback = $2,
               graded_by = $3,
               published_at = COALESCE($4, published_at),
               updated_at = NOW()
           WHERE submission_id = $5
           RETURNING *`,
          [marks, feedback || '', user.id, published_at, submissionId]
        );
        gradeRecord = updateRes.rows[0];
      } else {
        const insertRes = await pool.query(
          `INSERT INTO grades (submission_id, graded_by, marks_obtained, feedback, published_at)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [submissionId, user.id, marks, feedback || '', published_at]
        );
        gradeRecord = insertRes.rows[0];
      }

      // Update submission status to graded
      await pool.query('UPDATE submissions SET status = $1, updated_at = NOW() WHERE id = $2', ['graded', submissionId]);

      await logActivity(
        user.id,
        publish ? 'GRADE_PUBLISHED' : 'GRADE_SAVED',
        `${user.full_name} graded ${sub.student_name}'s submission for "${sub.assignment_title}": ${marks}/${sub.max_marks}`
      );

      res.json({
        success: true,
        message: publish ? 'Grade published successfully.' : 'Grade saved as draft.',
        grade: gradeRecord
      });
      return;
    }

    // Local engine
    const memory = getMemoryStore();
    const sub = memory.submissions.find(s => s.id === submissionId);
    if (!sub) {
      res.status(404).json({ success: false, error: 'Submission not found.' });
      return;
    }

    const assignment = memory.assignments.find(a => a.id === sub.assignment_id);
    const student = memory.users.find(u => u.id === sub.student_id);

    if (user.role !== 'admin' && assignment?.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'Only the assignment instructor can grade this submission.' });
      return;
    }

    if (assignment && marks > assignment.max_marks) {
      res.status(400).json({
        success: false,
        error: `Marks obtained (${marks}) cannot exceed the assignment maximum of ${assignment.max_marks}.`
      });
      return;
    }

    let grade = memory.grades.find(g => g.submission_id === submissionId);
    const now = new Date().toISOString();

    if (grade) {
      grade.marks_obtained = marks;
      grade.feedback = feedback || '';
      grade.graded_by = user.id;
      if (publish) grade.published_at = now;
      grade.updated_at = now;
    } else {
      grade = {
        id: memory.sequences.grades++,
        submission_id: submissionId,
        graded_by: user.id,
        marks_obtained: marks,
        feedback: feedback || '',
        published_at: publish ? now : null,
        created_at: now,
        updated_at: now
      };
      memory.grades.push(grade);
    }

    sub.status = 'graded';
    sub.updated_at = now;

    await logActivity(
      user.id,
      publish ? 'GRADE_PUBLISHED' : 'GRADE_SAVED',
      `${user.full_name} graded ${student?.full_name || 'student'}'s submission for "${assignment?.title || ''}": ${marks}/${assignment?.max_marks || 100}`
    );

    res.json({
      success: true,
      message: publish ? 'Grade published successfully.' : 'Grade saved as draft.',
      grade
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function publishGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
  const submissionId = parseInt(req.params.id);
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      const subRes = await pool.query(
        `SELECT s.*, a.teacher_id, a.title as assignment_title, u.full_name as student_name
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         JOIN users u ON s.student_id = u.id
         WHERE s.id = $1`,
        [submissionId]
      );
      if (subRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Submission not found.' });
        return;
      }
      const sub = subRes.rows[0];

      if (user.role !== 'admin' && sub.teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Access denied.' });
        return;
      }

      const updateRes = await pool.query(
        'UPDATE grades SET published_at = NOW(), updated_at = NOW() WHERE submission_id = $1 RETURNING *',
        [submissionId]
      );
      if (updateRes.rows.length === 0) {
        res.status(400).json({ success: false, error: 'No grade recorded for this submission yet.' });
        return;
      }

      await logActivity(user.id, 'GRADE_PUBLISHED', `Published grade for ${sub.student_name} on "${sub.assignment_title}"`);
      res.json({ success: true, message: 'Grade published to student.', grade: updateRes.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    const grade = memory.grades.find(g => g.submission_id === submissionId);
    if (!grade) {
      res.status(400).json({ success: false, error: 'No grade recorded for this submission yet.' });
      return;
    }

    grade.published_at = new Date().toISOString();
    grade.updated_at = new Date().toISOString();

    res.json({ success: true, message: 'Grade published to student.', grade });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMyGrades(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      const result = await pool.query(
        `SELECT g.id as grade_id, g.marks_obtained, g.feedback, g.published_at,
                s.id as submission_id, s.submitted_at, s.is_late,
                a.id as assignment_id, a.title as assignment_title, a.max_marks,
                c.course_code, c.course_name, u.full_name as teacher_name
         FROM grades g
         JOIN submissions s ON g.submission_id = s.id
         JOIN assignments a ON s.assignment_id = a.id
         JOIN courses c ON a.course_id = c.id
         JOIN users u ON a.teacher_id = u.id
         WHERE s.student_id = $1 AND g.published_at IS NOT NULL
         ORDER BY g.published_at DESC`,
        [user.id]
      );

      const grades = result.rows;
      let totalEarned = 0;
      let totalMax = 0;
      grades.forEach((g: any) => {
        totalEarned += parseFloat(g.marks_obtained);
        totalMax += parseFloat(g.max_marks);
      });

      const averagePercentage = totalMax > 0 ? ((totalEarned / totalMax) * 100).toFixed(1) : '0.0';

      res.json({
        success: true,
        stats: {
          total_graded: grades.length,
          total_earned: totalEarned,
          total_possible: totalMax,
          average_percentage: parseFloat(averagePercentage)
        },
        grades
      });
      return;
    }

    const memory = getMemoryStore();
    const grades = memory.grades
      .filter(g => g.published_at !== null)
      .map(g => {
        const sub = memory.submissions.find(s => s.id === g.submission_id && s.student_id === user.id);
        if (!sub) return null;

        const assignment = memory.assignments.find(a => a.id === sub.assignment_id);
        const course = assignment ? memory.courses.find(c => c.id === assignment.course_id) : null;
        const teacher = assignment ? memory.users.find(u => u.id === assignment.teacher_id) : null;

        return {
          grade_id: g.id,
          marks_obtained: g.marks_obtained,
          feedback: g.feedback,
          published_at: g.published_at,
          submission_id: sub.id,
          submitted_at: sub.submitted_at,
          is_late: sub.is_late,
          assignment_id: assignment?.id,
          assignment_title: assignment?.title || 'Assignment',
          max_marks: assignment?.max_marks || 100,
          course_code: course?.course_code || 'CRS',
          course_name: course?.course_name || 'Course',
          teacher_name: teacher?.full_name || 'Teacher'
        };
      })
      .filter(Boolean) as any[];

    let totalEarned = 0;
    let totalMax = 0;
    grades.forEach(g => {
      totalEarned += g.marks_obtained;
      totalMax += g.max_marks;
    });

    const averagePercentage = totalMax > 0 ? ((totalEarned / totalMax) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      stats: {
        total_graded: grades.length,
        total_earned: totalEarned,
        total_possible: totalMax,
        average_percentage: parseFloat(averagePercentage)
      },
      grades
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
