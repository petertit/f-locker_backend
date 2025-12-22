// src/routes/raspi.js
import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";

const router = express.Router();

// GET /raspi/status
router.get("/status", (req, res) => RaspiController.status(req, res));

// POST /raspi/capture
router.post("/capture", (req, res) => RaspiController.capture(req, res));

// POST /raspi/recognize
router.post("/recognize", (req, res) => RaspiController.recognize(req, res));

// POST /raspi/record
router.post("/record", (req, res) => RaspiController.record(req, res));

// POST /raspi/unlock
router.post("/unlock", (req, res) => RaspiController.unlock(req, res));

// POST /raspi/lock
router.post("/lock", (req, res) => RaspiController.lock(req, res));

export default router;
