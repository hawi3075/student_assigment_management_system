import { Router } from 'express';
import {
  getCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent
} from '../controllers/courseController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getCourses);
router.post('/', requireRole('teacher', 'admin', 'super_admin'), createCourse);
router.get('/:id', getCourseById);
router.patch('/:id', requireRole('teacher', 'admin', 'super_admin'), updateCourse);
router.delete('/:id', requireRole('teacher', 'admin', 'super_admin'), deleteCourse);
router.post('/:id/enrollments', enrollStudent);
router.delete('/:id/enrollments/:studentId', unenrollStudent);

export default router;
