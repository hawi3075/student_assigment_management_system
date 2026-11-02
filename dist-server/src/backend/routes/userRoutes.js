import { Router } from "express";
import { updateProfile } from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
const router = Router();
router.get("/me", authenticateToken, (req, res) => {
  const { password_hash, ...safe } = req.user;
  res.json({ success: true, user: safe });
});
router.patch("/me", authenticateToken, updateProfile);
var userRoutes_default = router;
export {
  userRoutes_default as default
};
