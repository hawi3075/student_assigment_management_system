import { Router } from "express";
import {
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  getSubmissionById,
  downloadFile
} from "../controllers/submissionController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
const router = Router();
router.use(authenticateToken);
router.post("/assignment/:id/submit", requireRole("student"), upload.single("file"), submitAssignment);
router.post("/assignments/:id/submissions", requireRole("student"), upload.single("file"), submitAssignment);
router.get("/mine", requireRole("student"), getMySubmissions);
router.get("/assignment/:id", requireRole("teacher", "admin", "super_admin"), getAssignmentSubmissions);
router.get("/assignments/:id/submissions", requireRole("teacher", "admin", "super_admin"), getAssignmentSubmissions);
router.get("/:id", getSubmissionById);
router.get("/:id/files/:fileId", downloadFile);
var submissionRoutes_default = router;
export {
  submissionRoutes_default as default
};
