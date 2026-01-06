// src/routes/locker.js
import express from "express";
import LockerController from "../app/controllers/LockerController.js";
import authUser from "../app/middlewares/auth_user.js";

const router = express.Router();

// public (frontend cần load trạng thái)
router.get("/status", (req, res) => LockerController.status(req, res));

// protected (cần login để update/register/unregister)
router.post("/update", authUser, (req, res) =>
  LockerController.update(req, res)
);

export default router;
