import { Router } from 'express';
import { saveGrade, publishGrade, getMyGrades } from '../controllers/gradeController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Teacher records or edits grade
router.post('/submission/:id', requireRole('teacher', 'admin', 'super_admin'), saveGrade);
router.patch('/submission/:id', requireRole('teacher', 'admin', 'super_admin'), saveGrade);
router.post('/submissions/:id/grade', requireRole('teacher', 'admin', 'super_admin'), saveGrade);
router.patch('/submissions/:id/grade', requireRole('teacher', 'admin', 'super_admin'), saveGrade);

// Teacher publishes grade
router.post('/submission/:id/publish', requireRole('teacher', 'admin', 'super_admin'), publishGrade);
router.post('/submissions/:id/grade/publish', requireRole('teacher', 'admin', 'super_admin'), publishGrade);

// Student view their grades
router.get('/mine', requireRole('student'), getMyGrades);

export default router;
