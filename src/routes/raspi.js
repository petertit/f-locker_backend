// src/routes/raspi.js
import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";
import authUser from "../app/middlewares/auth_user.js";

const router = express.Router();

router.get("/status", authUser, (req, res) => RaspiController.status(req, res));
router.post("/lock", authUser, (req, res) => RaspiController.lock(req, res));
router.post("/unlock", authUser, (req, res) =>
  RaspiController.unlock(req, res)
);

router.post("/recognize-remote", authUser, (req, res) =>
  RaspiController.recognizeRemote(req, res)
);

router.post("/capture-remote-batch", authUser, (req, res) =>
  RaspiController.captureRemoteBatch(req, res)
);

router.post("/capture-batch", authUser, (req, res) =>
  RaspiController.captureBatch(req, res)
);

export default router;
