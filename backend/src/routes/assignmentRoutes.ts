import { Router } from 'express';
import {
  getAssignments,
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  addAttachment
} from '../controllers/assignmentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssignments);
router.post('/', requireRole('teacher', 'admin', 'super_admin'), createAssignment);
router.get('/:id', getAssignmentById);
router.patch('/:id', requireRole('teacher', 'admin', 'super_admin'), updateAssignment);
router.delete('/:id', requireRole('teacher', 'admin', 'super_admin'), deleteAssignment);
router.post('/:id/attachments', requireRole('teacher', 'admin', 'super_admin'), upload.single('file'), addAttachment);

export default router;
