// src/routes/raspi.js
import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";

const router = express.Router();

// GET /raspi/status
router.get("/status", (req, res) => RaspiController.status(req, res));

// POST /raspi/unlock
router.post("/unlock", (req, res) => RaspiController.unlock(req, res));

// POST /raspi/lock
router.post("/lock", (req, res) => RaspiController.lock(req, res));

export default router;
