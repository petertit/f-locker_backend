import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";
import authUser from "../app/middlewares/auth_user.js";

const router = express.Router();

// GET /raspi/status
router.get("/status", authUser, (req, res) => RaspiController.status(req, res));

// POST /raspi/unlock
router.post("/unlock", authUser, (req, res) => RaspiController.unlock(req, res));

// POST /raspi/lock
router.post("/lock", authUser, (req, res) => RaspiController.lock(req, res));

// ✅ POST /raspi/recognize-remote  (nhận ảnh từ browser -> backend -> raspi)
router.post("/recognize-remote", authUser, (req, res) =>
  RaspiController.recognizeRemote(req, res)
);

export default router;
