// src/routes/raspi.js
import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";
import authUser from "../app/middlewares/auth_user.js";

const router = express.Router();

// Nếu bạn muốn bảo vệ bằng JWT user => bật authUser
router.use(authUser);

// GET /raspi/status
router.get("/status", (req, res) => RaspiController.status(req, res));

// POST /raspi/unlock
router.post("/unlock", (req, res) => RaspiController.unlock(req, res));

// POST /raspi/lock
router.post("/lock", (req, res) => RaspiController.lock(req, res));

// ✅ POST /raspi/recognize
router.post("/recognize", (req, res) => RaspiController.recognize(req, res));

// ✅ POST /raspi/recognize-remote
router.post("/recognize-remote", (req, res) =>
  RaspiController.recognizeRemote(req, res)
);

// optional
router.post("/capture", (req, res) => RaspiController.capture(req, res));
router.post("/record", (req, res) => RaspiController.record(req, res));

export default router;
