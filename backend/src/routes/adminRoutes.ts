import { Router } from 'express';
import { getAdminStats, getActivityLogs } from '../controllers/adminController.js';
import { getAdminUsers, updateUserStatus, createAdminUser, bootstrapAdmin } from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Publicly reachable secure bootstrap endpoint for setting up the primary administrator
router.post('/bootstrap', bootstrapAdmin);

// Protected admin routes
router.use(authenticateToken);
router.use(requireRole('admin', 'super_admin'));

router.get('/stats', getAdminStats);
router.get('/activity', getActivityLogs);
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.patch('/users/:id/status', updateUserStatus);

export default router;
