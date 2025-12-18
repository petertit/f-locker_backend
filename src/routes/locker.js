// server/src/routes/locker.js
import express from "express";
import LockerController from "../app/controllers/LockerController.js";

const router = express.Router();

router.get("/lockers/status", (req, res) => LockerController.status(req, res));
router.post("/lockers/update", (req, res) => LockerController.update(req, res));

export default router;
