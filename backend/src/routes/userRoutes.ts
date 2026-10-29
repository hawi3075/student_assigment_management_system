import { Router } from 'express';
import { updateProfile } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticateToken, (req: any, res: any) => {
  const { password_hash, ...safe } = req.user;
  res.json({ success: true, user: safe });
});
router.patch('/me', authenticateToken, updateProfile);

export default router;
