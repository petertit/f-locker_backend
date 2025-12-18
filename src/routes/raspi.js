// server/src/routes/raspi.js
import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";

const router = express.Router();

router.get("/raspi/status", (req, res) => RaspiController.status(req, res));
router.post("/raspi/capture", (req, res) => RaspiController.capture(req, res));

router.post("/raspi/capture-batch", (req, res) =>
  RaspiController.captureBatch(req, res)
);
router.post("/raspi/capture-remote-batch", (req, res) =>
  RaspiController.captureRemoteBatch(req, res)
);

router.get("/raspi/recognize", (req, res) =>
  RaspiController.recognize(req, res)
);
router.post("/raspi/recognize-remote", (req, res) =>
  RaspiController.recognizeRemote(req, res)
);

router.post("/raspi/unlock", (req, res) => RaspiController.unlock(req, res));
router.post("/raspi/lock", (req, res) => RaspiController.lock(req, res));

export default router;
