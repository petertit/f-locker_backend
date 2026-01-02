// src/routes/raspi.js
import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";
import authUser from "../middlewares/auth_user.js";

const router = express.Router();

// lock/unlock (open.js dùng)
router.post("/lock", authUser, (req, res) => RaspiController.lock(req, res));
router.post("/unlock", authUser, (req, res) =>
  RaspiController.unlock(req, res)
);

// recognize remote (scan.js dùng)
router.post("/recognize-remote", authUser, (req, res) =>
  RaspiController.recognizeRemote(req, res)
);

export default router;
