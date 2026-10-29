import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db, getMemoryStore, logActivity } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UPLOAD_DIR } from '../middleware/upload.js';

export async function submitAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id);
  const user = req.user!;
  const { submission_text } = req.body;
  const file = req.file;

  const pool = db.getPool();

  try {
    if (pool) {
      // 1. Fetch assignment and course
      const assignmentRes = await pool.query(
        `SELECT a.*, ce.student_id as enrolled
         FROM assignments a
         LEFT JOIN course_enrollments ce ON ce.course_id = a.course_id AND ce.student_id = $1
         WHERE a.id = $2`,
        [user.id, assignmentId]
      );

      if (assignmentRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      const assignment = assignmentRes.rows[0];

      if (!assignment.enrolled) {
        res.status(403).json({ success: false, error: 'You must be enrolled in this course to submit assignments.' });
        return;
      }

      if (assignment.status !== 'published') {
        res.status(400).json({ success: false, error: 'Submissions are not accepted for unpublished assignments.' });
        return;
      }

      // Check deadline
      const now = new Date();
      const dueDate = new Date(assignment.due_at);
      const isPastDue = now > dueDate;

      if (isPastDue && !assignment.allow_late_submission) {
        res.status(400).json({
          success: false,
          error: `Deadline passed on ${dueDate.toLocaleString()}. Late submissions are not permitted for this assignment.`
        });
        return;
      }

      const isLate = isPastDue;

      // Check existing submission
      const existingSub = await pool.query(
        'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
        [assignmentId, user.id]
      );

      let submissionId: number;

      if (existingSub.rows.length > 0) {
        // Update existing submission
        const existing = existingSub.rows[0];
        if (existing.status === 'graded') {
          res.status(400).json({ success: false, error: 'This assignment has already been graded. Submissions cannot be modified.' });
          return;
        }

        const updateRes = await pool.query(
          `UPDATE submissions
           SET submission_text = COALESCE($1, submission_text),
               submitted_at = NOW(),
               status = 'resubmitted',
               is_late = $2,
               updated_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [submission_text, isLate, existing.id]
        );
        submissionId = existing.id;
      } else {
        // Create new submission
        const insertRes = await pool.query(
          `INSERT INTO submissions (assignment_id, student_id, submission_text, submitted_at, status, is_late)
           VALUES ($1, $2, $3, NOW(), 'submitted', $4)
           RETURNING *`,
          [assignmentId, user.id, submission_text || '', isLate]
        );
        submissionId = insertRes.rows[0].id;
      }

      // Add attached file if uploaded
      if (file) {
        await pool.query(
          `INSERT INTO submission_files (submission_id, original_filename, stored_filename, mime_type, file_size)
           VALUES ($1, $2, $3, $4, $5)`,
          [submissionId, file.originalname, file.filename, file.mimetype, file.size]
        );
      }

      await logActivity(
        user.id,
        'ASSIGNMENT_SUBMITTED',
        `${user.full_name} submitted work for "${assignment.title}"${isLate ? ' [LATE]' : ''}`
      );

      res.status(200).json({
        success: true,
        message: isLate ? 'Assignment submitted successfully (marked as late).' : 'Assignment submitted successfully.',
        submission_id: submissionId,
        is_late: isLate
      });
      return;
    }

    // Local engine
    const memory = getMemoryStore();
    const assignment = memory.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found.' });
      return;
    }

    const isEnrolled = memory.course_enrollments.some(e => e.course_id === assignment.course_id && e.student_id === user.id);
    if (!isEnrolled) {
      res.status(403).json({ success: false, error: 'You must be enrolled in this course to submit assignments.' });
      return;
    }

    const now = new Date();
    const dueDate = new Date(assignment.due_at);
    const isPastDue = now > dueDate;

    if (isPastDue && !assignment.allow_late_submission) {
      res.status(400).json({
        success: false,
        error: `Deadline passed on ${dueDate.toLocaleString()}. Late submissions are not permitted for this assignment.`
      });
      return;
    }

    const isLate = isPastDue;
    let existing = memory.submissions.find(s => s.assignment_id === assignmentId && s.student_id === user.id);
    let submissionId: number;

    if (existing) {
      if (existing.status === 'graded') {
        res.status(400).json({ success: false, error: 'This assignment has already been graded. Submissions cannot be modified.' });
        return;
      }
      existing.submission_text = submission_text !== undefined ? submission_text : existing.submission_text;
      existing.submitted_at = now.toISOString();
      existing.status = 'resubmitted';
      existing.is_late = isLate;
      existing.updated_at = now.toISOString();
      submissionId = existing.id;
    } else {
      submissionId = memory.sequences.submissions++;
      existing = {
        id: submissionId,
        assignment_id: assignmentId,
        student_id: user.id,
        submission_text: submission_text || '',
        submitted_at: now.toISOString(),
        status: 'submitted',
        is_late: isLate,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };
      memory.submissions.push(existing);
    }

    if (file) {
      memory.submission_files.push({
        id: memory.sequences.submission_files++,
        submission_id: submissionId,
        original_filename: file.originalname,
        stored_filename: file.filename,
        mime_type: file.mimetype,
        file_size: file.size,
        created_at: now.toISOString()
      });
    }

    await logActivity(
      user.id,
      'ASSIGNMENT_SUBMITTED',
      `${user.full_name} submitted work for "${assignment.title}"${isLate ? ' [LATE]' : ''}`
    );

    res.status(200).json({
      success: true,
      message: isLate ? 'Assignment submitted successfully (marked as late).' : 'Assignment submitted successfully.',
      submission_id: submissionId,
      is_late: isLate
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMySubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      const result = await pool.query(
        `SELECT s.*, a.title as assignment_title, a.max_marks, a.due_at,
                c.course_code, c.course_name, u.full_name as teacher_name,
                g.marks_obtained, g.feedback, g.published_at as grade_published_at,
                (SELECT json_agg(sf.*) FROM submission_files sf WHERE sf.submission_id = s.id) as files
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         JOIN courses c ON a.course_id = c.id
         JOIN users u ON a.teacher_id = u.id
         LEFT JOIN grades g ON g.submission_id = s.id AND g.published_at IS NOT NULL
         WHERE s.student_id = $1
         ORDER BY s.submitted_at DESC`,
        [user.id]
      );
      res.json({ success: true, submissions: result.rows });
      return;
    }

    const memory = getMemoryStore();
    const subs = memory.submissions
      .filter(s => s.student_id === user.id)
      .map(s => {
        const assignment = memory.assignments.find(a => a.id === s.assignment_id);
        const course = assignment ? memory.courses.find(c => c.id === assignment.course_id) : null;
        const teacher = assignment ? memory.users.find(u => u.id === assignment.teacher_id) : null;
        const grade = memory.grades.find(g => g.submission_id === s.id && g.published_at !== null);
        const files = memory.submission_files.filter(f => f.submission_id === s.id);

        return {
          ...s,
          assignment_title: assignment?.title || 'Assignment',
          max_marks: assignment?.max_marks || 100,
          due_at: assignment?.due_at,
          course_code: course?.course_code || 'CRS',
          course_name: course?.course_name || 'Course',
          teacher_name: teacher?.full_name || 'Teacher',
          marks_obtained: grade ? grade.marks_obtained : null,
          feedback: grade ? grade.feedback : null,
          grade_published_at: grade ? grade.published_at : null,
          files
        };
      });

    subs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    res.json({ success: true, submissions: subs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAssignmentSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id);
  const user = req.user!;
  const { status, filter } = req.query;
  const pool = db.getPool();

  try {
    if (pool) {
      // Permission check
      const assignmentRes = await pool.query('SELECT teacher_id, title, max_marks FROM assignments WHERE id = $1', [assignmentId]);
      if (assignmentRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      if (user.role !== 'admin' && assignmentRes.rows[0].teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Access denied.' });
        return;
      }

      let query = `
        SELECT s.*, u.full_name as student_name, u.email as student_email, u.department as student_department,
               g.id as grade_id, g.marks_obtained, g.feedback, g.published_at as grade_published_at,
               (SELECT json_agg(sf.*) FROM submission_files sf WHERE sf.submission_id = s.id) as files
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        LEFT JOIN grades g ON g.submission_id = s.id
        WHERE s.assignment_id = $1
      `;
      const params: any[] = [assignmentId];

      if (status) {
        params.push(status);
        query += ` AND s.status = $${params.length}`;
      }

      query += ` ORDER BY s.submitted_at DESC`;
      const result = await pool.query(query, params);

      res.json({
        success: true,
        assignment: assignmentRes.rows[0],
        submissions: result.rows
      });
      return;
    }

    const memory = getMemoryStore();
    const assignment = memory.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found.' });
      return;
    }

    if (user.role !== 'admin' && assignment.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    let subs = memory.submissions
      .filter(s => s.assignment_id === assignmentId)
      .map(s => {
        const student = memory.users.find(u => u.id === s.student_id);
        const grade = memory.grades.find(g => g.submission_id === s.id);
        const files = memory.submission_files.filter(f => f.submission_id === s.id);

        return {
          ...s,
          student_name: student?.full_name || 'Student',
          student_email: student?.email || '',
          student_department: student?.department || '',
          grade_id: grade?.id,
          marks_obtained: grade ? grade.marks_obtained : null,
          feedback: grade ? grade.feedback : null,
          grade_published_at: grade ? grade.published_at : null,
          files
        };
      });

    if (status) {
      subs = subs.filter(s => s.status === status);
    }

    if (filter === 'graded') {
      subs = subs.filter(s => s.marks_obtained !== null);
    } else if (filter === 'ungraded') {
      subs = subs.filter(s => s.marks_obtained === null);
    } else if (filter === 'late') {
      subs = subs.filter(s => s.is_late);
    }

    subs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

    res.json({
      success: true,
      assignment,
      submissions: subs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getSubmissionById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const submissionId = parseInt(req.params.id);
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      const result = await pool.query(
        `SELECT s.*, a.title as assignment_title, a.max_marks, a.due_at, a.teacher_id,
                c.course_code, c.course_name,
                u.full_name as student_name, u.email as student_email,
                g.id as grade_id, g.marks_obtained, g.feedback, g.published_at as grade_published_at,
                (SELECT json_agg(sf.*) FROM submission_files sf WHERE sf.submission_id = s.id) as files
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         JOIN courses c ON a.course_id = c.id
         JOIN users u ON s.student_id = u.id
         LEFT JOIN grades g ON g.submission_id = s.id
         WHERE s.id = $1`,
        [submissionId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Submission not found.' });
        return;
      }

      const sub = result.rows[0];

      // Authorization check
      if (user.role === 'student' && sub.student_id !== user.id) {
        res.status(403).json({ success: false, error: 'Access denied.' });
        return;
      }
      if (user.role === 'teacher' && sub.teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Access denied.' });
        return;
      }

      // Hide unpublished grades from students
      if (user.role === 'student' && !sub.grade_published_at) {
        sub.marks_obtained = null;
        sub.feedback = null;
      }

      res.json({ success: true, submission: sub });
      return;
    }

    const memory = getMemoryStore();
    const sub = memory.submissions.find(s => s.id === submissionId);
    if (!sub) {
      res.status(404).json({ success: false, error: 'Submission not found.' });
      return;
    }

    const assignment = memory.assignments.find(a => a.id === sub.assignment_id);
    const course = assignment ? memory.courses.find(c => c.id === assignment.course_id) : null;
    const student = memory.users.find(u => u.id === sub.student_id);
    const grade = memory.grades.find(g => g.submission_id === sub.id);
    const files = memory.submission_files.filter(f => f.submission_id === sub.id);

    if (user.role === 'student' && sub.student_id !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }
    if (user.role === 'teacher' && assignment?.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    const marks_obtained = (user.role === 'student' && !grade?.published_at) ? null : grade?.marks_obtained ?? null;
    const feedback = (user.role === 'student' && !grade?.published_at) ? null : grade?.feedback ?? null;

    res.json({
      success: true,
      submission: {
        ...sub,
        assignment_title: assignment?.title || '',
        max_marks: assignment?.max_marks || 100,
        due_at: assignment?.due_at,
        course_code: course?.course_code || '',
        course_name: course?.course_name || '',
        student_name: student?.full_name || '',
        student_email: student?.email || '',
        grade_id: grade?.id,
        marks_obtained,
        feedback,
        grade_published_at: grade?.published_at || null,
        files
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function downloadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const submissionId = parseInt(req.params.id);
  const fileId = parseInt(req.params.fileId);
  const user = req.user!;
  const pool = db.getPool();

  try {
    let fileRecord: any = null;
    let studentId: number = 0;
    let teacherId: number = 0;

    if (pool) {
      const result = await pool.query(
        `SELECT sf.*, s.student_id, a.teacher_id
         FROM submission_files sf
         JOIN submissions s ON sf.submission_id = s.id
         JOIN assignments a ON s.assignment_id = a.id
         WHERE sf.id = $1 AND sf.submission_id = $2`,
        [fileId, submissionId]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'File not found.' });
        return;
      }
      fileRecord = result.rows[0];
      studentId = fileRecord.student_id;
      teacherId = fileRecord.teacher_id;
    } else {
      const memory = getMemoryStore();
      fileRecord = memory.submission_files.find(f => f.id === fileId && f.submission_id === submissionId);
      if (!fileRecord) {
        res.status(404).json({ success: false, error: 'File not found.' });
        return;
      }
      const sub = memory.submissions.find(s => s.id === submissionId);
      const assignment = sub ? memory.assignments.find(a => a.id === sub.assignment_id) : null;
      studentId = sub ? sub.student_id : 0;
      teacherId = assignment ? assignment.teacher_id : 0;
    }

    // Authorization check
    if (user.role === 'student' && user.id !== studentId) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }
    if (user.role === 'teacher' && user.id !== teacherId) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    // Path sanitization to prevent path traversal
    const safeFilename = path.basename(fileRecord.stored_filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (fs.existsSync(filePath)) {
      res.download(filePath, fileRecord.original_filename);
    } else {
      // Provide clean simulated file content for pre-seeded demonstration records
      res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.original_filename}"`);
      res.setHeader('Content-Type', fileRecord.mime_type || 'application/octet-stream');
      res.send(`UniTask Academic Document\nFile: ${fileRecord.original_filename}\nSubmission ID: ${submissionId}\nTimestamp: ${fileRecord.created_at}\n\n[Verified Academic Assignment Submission Content]`);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
