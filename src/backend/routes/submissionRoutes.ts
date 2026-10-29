import { Router } from 'express';
import {
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  getSubmissionById,
  downloadFile
} from '../controllers/submissionController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);

// Student submits or resubmits work
router.post('/assignment/:id/submit', requireRole('student'), upload.single('file'), submitAssignment);
router.post('/assignments/:id/submissions', requireRole('student'), upload.single('file'), submitAssignment);

// Student view their submissions
router.get('/mine', requireRole('student'), getMySubmissions);

// Teacher view submissions for assignment
router.get('/assignment/:id', requireRole('teacher', 'admin', 'super_admin'), getAssignmentSubmissions);
router.get('/assignments/:id/submissions', requireRole('teacher', 'admin', 'super_admin'), getAssignmentSubmissions);

// View specific submission details
router.get('/:id', getSubmissionById);

// Authenticated secure file download
router.get('/:id/files/:fileId', downloadFile);

export default router;
