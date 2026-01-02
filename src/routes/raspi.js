import express from "express";
import multer from "multer";
import RaspiController from "../app/controllers/RaspiController.js";
import authUser from "../app/middlewares/auth_user.js"; // ✅ đúng tên

const router = express.Router();

// multer: nhận ảnh từ scan.js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1_000_000, // 1MB
  },
});

// GET /raspi/status
router.get("/status", (req, res) => RaspiController.status(req, res));

// POST /raspi/unlock
router.post("/unlock", (req, res) => RaspiController.unlock(req, res));

// POST /raspi/lock
router.post("/lock", (req, res) => RaspiController.lock(req, res));

// POST /raspi/capture (optional)
router.post("/capture", (req, res) => RaspiController.capture(req, res));

// ✅ FACE RECOGNITION (scan.js POST vào đây)
router.post(
  "/recognize-remote",
  authUser, // ✅ SỬA Ở ĐÂY
  upload.single("image"), // field name = image
  RaspiController.recognizeRemote
);

export default router;
