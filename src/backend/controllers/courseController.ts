import { Response } from 'express';
import { db, getMemoryStore, logActivity } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      if (user.role === 'teacher') {
        const result = await pool.query(
          `SELECT c.*, u.full_name as teacher_name, 
                  (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as student_count,
                  (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) as assignment_count
           FROM courses c
           JOIN users u ON c.teacher_id = u.id
           WHERE c.teacher_id = $1
           ORDER BY c.created_at DESC`,
          [user.id]
        );
        res.json({ success: true, courses: result.rows });
        return;
      } else if (user.role === 'student') {
        const result = await pool.query(
          `SELECT c.*, u.full_name as teacher_name,
                  EXISTS(SELECT 1 FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.student_id = $1) as is_enrolled,
                  (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id AND a.status = 'published') as assignment_count
           FROM courses c
           JOIN users u ON c.teacher_id = u.id
           ORDER BY c.course_code ASC`,
          [user.id]
        );
        res.json({ success: true, courses: result.rows });
        return;
      } else {
        // Admin
        const result = await pool.query(
          `SELECT c.*, u.full_name as teacher_name,
                  (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as student_count,
                  (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) as assignment_count
           FROM courses c
           JOIN users u ON c.teacher_id = u.id
           ORDER BY c.created_at DESC`
        );
        res.json({ success: true, courses: result.rows });
        return;
      }
    }

    // Local engine
    const memory = getMemoryStore();
    let courses = memory.courses.map(c => {
      const teacher = memory.users.find(u => u.id === c.teacher_id);
      const studentCount = memory.course_enrollments.filter(e => e.course_id === c.id).length;
      const assignmentCount = memory.assignments.filter(a => a.course_id === c.id).length;
      const isEnrolled = memory.course_enrollments.some(e => e.course_id === c.id && e.student_id === user.id);

      return {
        ...c,
        teacher_name: teacher?.full_name || 'Instructor',
        student_count: studentCount,
        assignment_count: assignmentCount,
        is_enrolled: isEnrolled
      };
    });

    if (user.role === 'teacher') {
      courses = courses.filter(c => c.teacher_id === user.id);
    }

    res.json({ success: true, courses });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { course_code, course_name, description, semester } = req.body;
  const user = req.user!;

  if (!course_code || !course_name) {
    res.status(400).json({ success: false, error: 'Course code and course name are required.' });
    return;
  }

  const pool = db.getPool();
  try {
    if (pool) {
      const codeCheck = await pool.query('SELECT id FROM courses WHERE UPPER(course_code) = UPPER($1)', [course_code.trim()]);
      if (codeCheck.rows.length > 0) {
        res.status(400).json({ success: false, error: `Course code ${course_code} is already in use.` });
        return;
      }

      const insert = await pool.query(
        `INSERT INTO courses (course_code, course_name, description, teacher_id, semester)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [course_code.trim().toUpperCase(), course_name.trim(), description || '', user.id, semester || 'Fall 2026']
      );
      await logActivity(user.id, 'COURSE_CREATED', `${user.full_name} created course ${course_code.toUpperCase()}`);
      res.status(201).json({ success: true, course: insert.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    if (memory.courses.some(c => c.course_code.toUpperCase() === course_code.trim().toUpperCase())) {
      res.status(400).json({ success: false, error: `Course code ${course_code} is already in use.` });
      return;
    }

    const newCourse = {
      id: memory.sequences.courses++,
      course_code: course_code.trim().toUpperCase(),
      course_name: course_name.trim(),
      description: description || '',
      teacher_id: user.id,
      semester: semester || 'Fall 2026',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memory.courses.push(newCourse);
    await logActivity(user.id, 'COURSE_CREATED', `${user.full_name} created course ${course_code.toUpperCase()}`);

    res.status(201).json({ success: true, course: newCourse });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCourseById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id);
  const pool = db.getPool();

  try {
    if (pool) {
      const courseRes = await pool.query(
        `SELECT c.*, u.full_name as teacher_name, u.email as teacher_email
         FROM courses c
         JOIN users u ON c.teacher_id = u.id
         WHERE c.id = $1`,
        [courseId]
      );
      if (courseRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Course not found.' });
        return;
      }

      const enrollmentsRes = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.department, ce.enrolled_at
         FROM course_enrollments ce
         JOIN users u ON ce.student_id = u.id
         WHERE ce.course_id = $1
         ORDER BY u.full_name ASC`,
        [courseId]
      );

      const assignmentsRes = await pool.query(
        `SELECT a.*, (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count
         FROM assignments a
         WHERE a.course_id = $1
         ORDER BY a.due_at ASC`,
        [courseId]
      );

      res.json({
        success: true,
        course: courseRes.rows[0],
        students: enrollmentsRes.rows,
        assignments: assignmentsRes.rows
      });
      return;
    }

    const memory = getMemoryStore();
    const course = memory.courses.find(c => c.id === courseId);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    const teacher = memory.users.find(u => u.id === course.teacher_id);
    const enrollments = memory.course_enrollments.filter(e => e.course_id === courseId);
    const students = enrollments.map(e => {
      const u = memory.users.find(usr => usr.id === e.student_id);
      return {
        id: u?.id,
        full_name: u?.full_name,
        email: u?.email,
        department: u?.department,
        enrolled_at: e.enrolled_at
      };
    });

    const assignments = memory.assignments
      .filter(a => a.course_id === courseId)
      .map(a => ({
        ...a,
        submission_count: memory.submissions.filter(s => s.assignment_id === a.id).length
      }));

    res.json({
      success: true,
      course: {
        ...course,
        teacher_name: teacher?.full_name || 'Instructor',
        teacher_email: teacher?.email
      },
      students,
      assignments
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id);
  const { course_code, course_name, description, semester } = req.body;
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      // Check ownership
      const existing = await pool.query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
      if (existing.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Course not found.' });
        return;
      }
      if (user.role !== 'admin' && existing.rows[0].teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Only the course instructor or an administrator can update this course.' });
        return;
      }

      const updated = await pool.query(
        `UPDATE courses
         SET course_code = COALESCE($1, course_code),
             course_name = COALESCE($2, course_name),
             description = COALESCE($3, description),
             semester = COALESCE($4, semester),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [course_code, course_name, description, semester, courseId]
      );
      res.json({ success: true, course: updated.rows[0] });
      return;
    }

    const memory = getMemoryStore();
    const course = memory.courses.find(c => c.id === courseId);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    if (user.role !== 'admin' && course.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'Only the course instructor or an administrator can update this course.' });
      return;
    }

    if (course_code) course.course_code = course_code.toUpperCase();
    if (course_name) course.course_name = course_name;
    if (description !== undefined) course.description = description;
    if (semester) course.semester = semester;
    course.updated_at = new Date().toISOString();

    res.json({ success: true, course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id);
  const user = req.user!;
  const pool = db.getPool();

  try {
    if (pool) {
      const existing = await pool.query('SELECT teacher_id, course_code FROM courses WHERE id = $1', [courseId]);
      if (existing.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Course not found.' });
        return;
      }
      if (user.role !== 'admin' && existing.rows[0].teacher_id !== user.id) {
        res.status(403).json({ success: false, error: 'Permission denied.' });
        return;
      }

      await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);
      await logActivity(user.id, 'COURSE_DELETED', `Deleted course ${existing.rows[0].course_code}`);
      res.json({ success: true, message: 'Course deleted successfully.' });
      return;
    }

    const memory = getMemoryStore();
    const courseIndex = memory.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    const course = memory.courses[courseIndex];
    if (user.role !== 'admin' && course.teacher_id !== user.id) {
      res.status(403).json({ success: false, error: 'Permission denied.' });
      return;
    }

    memory.courses.splice(courseIndex, 1);
    // Cascade delete enrollments and assignments
    memory.course_enrollments = memory.course_enrollments.filter(e => e.course_id !== courseId);
    memory.assignments = memory.assignments.filter(a => a.course_id !== courseId);

    await logActivity(user.id, 'COURSE_DELETED', `Deleted course ${course.course_code}`);
    res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function enrollStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id);
  const user = req.user!;
  const studentId = req.body.student_id ? parseInt(req.body.student_id) : user.id;

  // Student can enroll self; teacher/admin can enroll any student
  if (user.role === 'student' && studentId !== user.id) {
    res.status(403).json({ success: false, error: 'Students can only enroll themselves.' });
    return;
  }

  const pool = db.getPool();
  try {
    if (pool) {
      const courseCheck = await pool.query('SELECT id, course_code FROM courses WHERE id = $1', [courseId]);
      if (courseCheck.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Course not found.' });
        return;
      }

      const dupCheck = await pool.query(
        'SELECT id FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
        [courseId, studentId]
      );
      if (dupCheck.rows.length > 0) {
        res.status(400).json({ success: false, error: 'Student is already enrolled in this course.' });
        return;
      }

      await pool.query(
        'INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)',
        [courseId, studentId]
      );
      await logActivity(user.id, 'COURSE_ENROLLED', `Student #${studentId} enrolled in course #${courseId}`);
      res.json({ success: true, message: 'Enrolled in course successfully.' });
      return;
    }

    const memory = getMemoryStore();
    const course = memory.courses.find(c => c.id === courseId);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    const exists = memory.course_enrollments.some(e => e.course_id === courseId && e.student_id === studentId);
    if (exists) {
      res.status(400).json({ success: false, error: 'Student is already enrolled in this course.' });
      return;
    }

    memory.course_enrollments.push({
      id: memory.sequences.course_enrollments++,
      course_id: courseId,
      student_id: studentId,
      enrolled_at: new Date().toISOString()
    });

    await logActivity(user.id, 'COURSE_ENROLLED', `Student #${studentId} enrolled in course ${course.course_code}`);
    res.json({ success: true, message: 'Enrolled in course successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function unenrollStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id);
  const studentId = parseInt(req.params.studentId);
  const user = req.user!;

  if (user.role === 'student' && studentId !== user.id) {
    res.status(403).json({ success: false, error: 'Permission denied.' });
    return;
  }

  const pool = db.getPool();
  try {
    if (pool) {
      await pool.query('DELETE FROM course_enrollments WHERE course_id = $1 AND student_id = $2', [courseId, studentId]);
      await logActivity(user.id, 'COURSE_UNENROLLED', `Student #${studentId} unenrolled from course #${courseId}`);
      res.json({ success: true, message: 'Unenrolled from course successfully.' });
      return;
    }

    const memory = getMemoryStore();
    memory.course_enrollments = memory.course_enrollments.filter(e => !(e.course_id === courseId && e.student_id === studentId));
    await logActivity(user.id, 'COURSE_UNENROLLED', `Student #${studentId} unenrolled from course #${courseId}`);
    res.json({ success: true, message: 'Unenrolled from course successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
