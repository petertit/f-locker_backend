import express from "express";
import LockerController from "../app/controllers/LockerController.js";
import authUser from "../app/middlewares/auth_user.js";

const router = express.Router();
// GET /lockers/status
router.get("/status", authUser, (req, res) =>
  LockerController.status(req, res)
);
// POST /lockers/update
router.post("/update", authUser, (req, res) =>
  LockerController.update(req, res)
);

export default router;
