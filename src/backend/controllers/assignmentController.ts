import { Response } from 'express';
import { db, getMemoryStore, logActivity } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { course_id, status, search, filter } = req.query;
  const pool = db.getPool();

  try {
    if (pool) {
      let query = `
        SELECT a.*, c.course_code, c.course_name, u.full_name as teacher_name,
               (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count,
               (SELECT COUNT(*) FROM assignment_attachments att WHERE att.assignment_id = a.id) as attachment_count
      `;

      if (user.role === 'student') {
        query += `,
          (SELECT s.status FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ${user.id}) as my_submission_status,
          (SELECT s.id FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ${user.id}) as my_submission_id,
          (SELECT g.marks_obtained FROM submissions s JOIN grades g ON g.submission_id = s.id WHERE s.assignment_id = a.id AND s.student_id = ${user.id} AND g.published_at IS NOT NULL) as my_marks
        `;
      }

      query += ` FROM assignments a
                 JOIN courses c ON a.course_id = c.id
                 JOIN users u ON a.teacher_id = u.id
                 WHERE 1=1 `;
      const params: any[] = [];

      if (user.role === 'student') {
        // Must be in published status and enrolled course
        query += ` AND a.status = 'published' AND c.id IN (SELECT course_id FROM course_enrollments WHERE student_id = $${params.length + 1})`;
        params.push(user.id);
      } else if (user.role === 'teacher') {
        query += ` AND a.teacher_id = $${params.length + 1}`;
        params.push(user.id);
      }

      if (course_id) {
        params.push(course_id);
        query += ` AND a.course_id = $${params.length}`;
      }

      if (status) {
        params.push(status);
        query += ` AND a.status = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (a.title ILIKE $${params.length} OR c.course_code ILIKE $${params.length} OR c.course_name ILIKE $${params.length})`;
      }

      query += ` ORDER BY a.due_at ASC`;
      const result = await pool.query(query, params);
      res.json({ success: true, assignments: result.rows });
      return;
    }

    // Local engine
    const memory = getMemoryStore();
    let assignments = memory.assignments.map(a => {
      const course = memory.courses.find(c => c.id === a.course_id);
      const teacher = memory.users.find(u => u.id === a.teacher_id);
      const submissionCount = memory.submissions.filter(s => s.assignment_id === a.id).length;
      const attachmentCount = memory.assignment_attachments.filter(att => att.assignment_id === a.id).length;

      let mySubmission = null;
      let myMarks = null;

      if (user.role === 'student') {
        const sub = memory.submissions.find(s => s.assignment_id === a.id && s.student_id === user.id);
        if (sub) {
          mySubmission = sub;
          const grade = memory.grades.find(g => g.submission_id === sub.id && g.published_at !== null);
          if (grade) {
            myMarks = grade.marks_obtained;
          }
        }
      }

      const isOverdue = new Date(a.due_at).getTime() < Date.now();

      return {
        ...a,
        course_code: course?.course_code || 'CRS',
        course_name: course?.course_name || 'Course',
        teacher_name: teacher?.full_name || 'Teacher',
        submission_count: submissionCount,
        attachment_count: attachmentCount,
        my_submission_status: mySubmission ? mySubmission.status : null,
        my_submission_id: mySubmission ? mySubmission.id : null,
        my_marks: myMarks,
        is_overdue: isOverdue
      };
    });

    if (user.role === 'student') {
      const enrolledCourseIds = memory.course_enrollments
        .filter(e => e.student_id === user.id)
        .map(e => e.course_id);
      assignments = assignments.filter(a => a.status === 'published' && enrolledCourseIds.includes(a.course_id));
    } else if (user.role === 'teacher') {
      assignments = assignments.filter(a => a.teacher_id === user.id);
    }

    if (course_id) {
      assignments = assignments.filter(a => a.course_id === parseInt(String(course_id)));
    }

    if (status) {
      assignments = assignments.filter(a => a.status === status);
    }

    if (filter === 'pending') {
      assignments = assignments.filter(a => !a.my_submission_status && !a.is_overdue);
    } else if (filter === 'submitted') {
      assignments = assignments.filter(a => a.my_submission_status === 'submitted' || a.my_submission_status === 'resubmitted');
    } else if (filter === 'graded') {
      assignments = assignments.filter(a => a.my_submission_status === 'graded');
    } else if (filter === 'overdue') {
      assignments = assignments.filter(a => !a.my_submission_status && a.is_overdue);
    }

    if (search) {
      const q = String(search).toLowerCase();
      assignments = assignments.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.course_code.toLowerCase().includes(q) ||
        a.course_name.toLowerCase().includes(q)
      );
    }

    assignments.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
    res.json({ success: true, assignments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { course_id, title, description, instructions, max_marks, due_at, allow_late_submission, status } = req.body;
  const user = req.user!;

  if (!course_id || !title || !description || !due_at) {
    res.status(400).json({ success: false, error: 'Course, title, description, and due date are required.' });
    return;
  }

  const marks = parseFloat(max_marks) || 100.0;
  if (marks <= 0) {
    res.status(400).json({ success: false, error: 'Maximum marks must be greater than zero.' });
    return;
  }

  const pool = db.getPool();
  try {
    if (pool) {
      // Check that teacher owns this course (or is admin)
      if (user.role !== 'admin') {
        const courseCheck = await pool.query('SELECT teacher_id FROM courses WHERE id = $1', [course_id]);
        if (courseCheck.rows.length === 0 || courseCheck.rows[0].teacher_id !== user.id) {
          res.status(403).json({ success: false, error: 'You can only create assignments for your own courses.' });
          return;
        }
      }

      const published_at = status === 'published' ? new Date() : null;
      const insert = await pool.query(
        `INSERT INTO assignments (course_id, teacher_id, title, description, instructions, max_marks, published_at, due_at, allow_late_submission, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [course_id, user.id, title.trim(), description.trim(), instructions || '', marks, published_at, due_at, !!allow_late_submission, status || 'draft']
      );

      await logActivity(user.id, 'ASSIGNMENT_CREATED', `${user.full_name} created assignment "${title}"`);
      res.status(201).json({ success: true, assignment: insert.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    const course = memory.courses.find(c => c.id === parseInt(course_id));
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    if (user.role !== 'admin' && course.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'You can only create assignments for your own courses.' });
      return;
    }

    const newAssignment = {
      id: memory.sequences.assignments++,
      course_id: parseInt(course_id),
      teacher_id: user.id,
      title: title.trim(),
      description: description.trim(),
      instructions: instructions || '',
      max_marks: marks,
      published_at: status === 'published' ? new Date().toISOString() : null,
      due_at: new Date(due_at).toISOString(),
      allow_late_submission: !!allow_late_submission,
      status: status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memory.assignments.push(newAssignment);

    await logActivity(user.id, 'ASSIGNMENT_CREATED', `${user.full_name} created assignment "${title}"`);
    res.status(201).json({ success: true, assignment: newAssignment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAssignmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id);
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      const result = await pool.query(
        `SELECT a.*, c.course_code, c.course_name, u.full_name as teacher_name, u.email as teacher_email
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         JOIN users u ON a.teacher_id = u.id
         WHERE a.id = $1`,
        [assignmentId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      const assignment = result.rows[0];

      // Student enrollment & permission check
      if (user.role === 'student') {
        const enrollCheck = await pool.query(
          'SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
          [assignment.course_id, user.id]
        );
        if (enrollCheck.rows.length === 0 || assignment.status !== 'published') {
          res.status(403).json({ success: false, error: 'You do not have access to this assignment.' });
          return;
        }
      }

      // Attachments
      const attachments = await pool.query('SELECT * FROM assignment_attachments WHERE assignment_id = $1', [assignmentId]);

      // If student, get their submission and grade
      let submission = null;
      let grade = null;
      if (user.role === 'student') {
        const subRes = await pool.query('SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2', [assignmentId, user.id]);
        if (subRes.rows.length > 0) {
          submission = subRes.rows[0];
          const filesRes = await pool.query('SELECT * FROM submission_files WHERE submission_id = $1', [submission.id]);
          submission.files = filesRes.rows;

          const gradeRes = await pool.query('SELECT * FROM grades WHERE submission_id = $1 AND published_at IS NOT NULL', [submission.id]);
          if (gradeRes.rows.length > 0) {
            grade = gradeRes.rows[0];
          }
        }
      }

      res.json({
        success: true,
        assignment,
        attachments: attachments.rows,
        submission,
        grade
      });
      return;
    }

    const memory = getMemoryStore();
    const assignment = memory.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found.' });
      return;
    }

    const course = memory.courses.find(c => c.id === assignment.course_id);
    const teacher = memory.users.find(u => u.id === assignment.teacher_id);

    if (user.role === 'student') {
      const isEnrolled = memory.course_enrollments.some(e => e.course_id === assignment.course_id && e.student_id === user.id);
      if (!isEnrolled || assignment.status !== 'published') {
        res.status(403).json({ success: false, error: 'You do not have access to this assignment.' });
        return;
      }
    }

    const attachments = memory.assignment_attachments.filter(att => att.assignment_id === assignmentId);
    let submission: any = null;
    let grade: any = null;

    if (user.role === 'student') {
      const sub = memory.submissions.find(s => s.assignment_id === assignmentId && s.student_id === user.id);
      if (sub) {
        const files = memory.submission_files.filter(f => f.submission_id === sub.id);
        submission = { ...sub, files };

        const g = memory.grades.find(gr => gr.submission_id === sub.id && gr.published_at !== null);
        if (g) {
          grade = g;
        }
      }
    }

    res.json({
      success: true,
      assignment: {
        ...assignment,
        course_code: course?.course_code || '',
        course_name: course?.course_name || '',
        teacher_name: teacher?.full_name || '',
        teacher_email: teacher?.email || ''
      },
      attachments,
      submission,
      grade
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id);
  const { title, description, instructions, max_marks, due_at, allow_late_submission, status } = req.body;
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      const existing = await pool.query('SELECT teacher_id, title FROM assignments WHERE id = $1', [assignmentId]);
      if (existing.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      if (user.role !== 'admin' && existing.rows[0].teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Permission denied. Only the owner or an administrator can modify this assignment.' });
        return;
      }

      const published_at_clause = status === 'published' ? `published_at = COALESCE(published_at, NOW()),` : '';
      const updated = await pool.query(
        `UPDATE assignments
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             instructions = COALESCE($3, instructions),
             max_marks = COALESCE($4, max_marks),
             due_at = COALESCE($5, due_at),
             allow_late_submission = COALESCE($6, allow_late_submission),
             status = COALESCE($7, status),
             ${published_at_clause}
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [title, description, instructions, max_marks, due_at, allow_late_submission, status, assignmentId]
      );

      await logActivity(user.id, 'ASSIGNMENT_UPDATED', `${user.full_name} updated assignment "${title || existing.rows[0].title}"`);
      res.json({ success: true, assignment: updated.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    const assignment = memory.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found.' });
      return;
    }

    if (user.role !== 'admin' && assignment.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'Permission denied.' });
      return;
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (instructions !== undefined) assignment.instructions = instructions;
    if (max_marks) assignment.max_marks = parseFloat(max_marks);
    if (due_at) assignment.due_at = new Date(due_at).toISOString();
    if (allow_late_submission !== undefined) assignment.allow_late_submission = !!allow_late_submission;
    if (status) {
      assignment.status = status;
      if (status === 'published' && !assignment.published_at) {
        assignment.published_at = new Date().toISOString();
      }
    }
    assignment.updated_at = new Date().toISOString();

    await logActivity(user.id, 'ASSIGNMENT_UPDATED', `${user.full_name} updated assignment "${assignment.title}"`);
    res.json({ success: true, assignment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id);
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      const existing = await pool.query('SELECT teacher_id, title FROM assignments WHERE id = $1', [assignmentId]);
      if (existing.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      if (user.role !== 'admin' && existing.rows[0].teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Permission denied.' });
        return;
      }

      await pool.query('DELETE FROM assignments WHERE id = $1', [assignmentId]);
      await logActivity(user.id, 'ASSIGNMENT_DELETED', `Deleted assignment "${existing.rows[0].title}"`);
      res.json({ success: true, message: 'Assignment deleted successfully.' });
      return;
    }

    const memory = getMemoryStore();
    const index = memory.assignments.findIndex(a => a.id === assignmentId);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Assignment not found.' });
      return;
    }

    const assignment = memory.assignments[index];
    if (user.role !== 'admin' && assignment.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'Permission denied.' });
      return;
    }

    memory.assignments.splice(index, 1);
    memory.submissions = memory.submissions.filter(s => s.assignment_id !== assignmentId);
    memory.assignment_attachments = memory.assignment_attachments.filter(att => att.assignment_id !== assignmentId);

    await logActivity(user.id, 'ASSIGNMENT_DELETED', `Deleted assignment "${assignment.title}"`);
    res.json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function addAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id);
  const user = req.user!;
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, error: 'No file provided.' });
    return;
  }

  const pool = db.getPool();
  try {
    if (pool) {
      const assignmentRes = await pool.query('SELECT teacher_id FROM assignments WHERE id = $1', [assignmentId]);
      if (assignmentRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      if (user.role !== 'admin' && assignmentRes.rows[0].teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Only the assignment owner can attach files.' });
        return;
      }

      const insert = await pool.query(
        `INSERT INTO assignment_attachments (assignment_id, original_filename, stored_filename, mime_type, file_size)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [assignmentId, file.originalname, file.filename, file.mimetype, file.size]
      );
      res.status(201).json({ success: true, attachment: insert.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    const assignment = memory.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found.' });
      return;
    }

    if (user.role !== 'admin' && assignment.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'Only the assignment owner can attach files.' });
      return;
    }

    const newAttachment = {
      id: memory.sequences.assignment_attachments++,
      assignment_id: assignmentId,
      original_filename: file.originalname,
      stored_filename: file.filename,
      mime_type: file.mimetype,
      file_size: file.size,
      created_at: new Date().toISOString()
    };
    memory.assignment_attachments.push(newAttachment);

    res.status(201).json({ success: true, attachment: newAttachment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
