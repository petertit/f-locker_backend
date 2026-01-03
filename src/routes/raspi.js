import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";
import authUser from "../app/middlewares/auth_user.js";

const router = express.Router();

// GET /raspi/status
router.get("/status", authUser, (req, res) => RaspiController.status(req, res));

// POST /raspi/unlock
router.post("/unlock", authUser, (req, res) =>
  RaspiController.unlock(req, res)
);

// POST /raspi/lock
router.post("/lock", authUser, (req, res) => RaspiController.lock(req, res));

// POST /raspi/recognize-remote
router.post("/recognize-remote", authUser, (req, res) =>
  RaspiController.recognizeRemote(req, res)
);

// ✅ NEW: POST /raspi/capture-remote-batch
router.post("/capture-remote-batch", authUser, (req, res) =>
  RaspiController.captureRemoteBatch(req, res)
);

export default router;
