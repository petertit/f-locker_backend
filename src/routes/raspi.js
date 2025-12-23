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
// POST /raspi/recognize
router.post("/recognize", authUser, (req, res) =>
  RaspiController.recognize(req, res)
);
// POST /raspi/capture
router.post("/capture", authUser, (req, res) =>
  RaspiController.capture(req, res)
);
// POST /raspi/record
router.post("/record", authUser, (req, res) =>
  RaspiController.record(req, res)
);

export default router;
