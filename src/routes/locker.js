// src/routes/locker.js
import express from "express";
import LockerController from "../app/controllers/LockerController.js";
import authUser from "../app/middlewares/auth_user.js";

const router = express.Router();

router.get("/status", (req, res) => LockerController.status(req, res));

router.post("/update", authUser, (req, res) =>
  LockerController.update(req, res)
);

router.post("/touch", authUser, (req, res) => LockerController.touch(req, res));

export default router;
