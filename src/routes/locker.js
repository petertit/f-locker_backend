import express from "express";
import LockerController from "../app/controllers/LockerController.js";

const router = express.Router();

// GET /api/lockers/status
router.get("/status", (req, res) => LockerController.status(req, res));

// POST /api/lockers/update
router.post("/update", (req, res) => LockerController.update(req, res));

export default router;
