import { Router } from "express";
import { saveGrade, publishGrade, getMyGrades } from "../controllers/gradeController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
const router = Router();
router.use(authenticateToken);
router.post("/submission/:id", requireRole("teacher", "admin", "super_admin"), saveGrade);
router.patch("/submission/:id", requireRole("teacher", "admin", "super_admin"), saveGrade);
router.post("/submissions/:id/grade", requireRole("teacher", "admin", "super_admin"), saveGrade);
router.patch("/submissions/:id/grade", requireRole("teacher", "admin", "super_admin"), saveGrade);
router.post("/submission/:id/publish", requireRole("teacher", "admin", "super_admin"), publishGrade);
router.post("/submissions/:id/grade/publish", requireRole("teacher", "admin", "super_admin"), publishGrade);
router.get("/mine", requireRole("student"), getMyGrades);
var gradeRoutes_default = router;
export {
  gradeRoutes_default as default
};
