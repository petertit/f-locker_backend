// server/src/routes/auth.js
import express from "express";
import AuthController from "../app/controllers/AuthController.js";
import HistoryController from "./history_inline.js";

const router = express.Router();

router.post("/register", (req, res) => AuthController.register(req, res));
router.post("/login", (req, res) => AuthController.login(req, res));
router.post("/update", (req, res) => AuthController.update(req, res));
router.get("/user/:id", (req, res) => AuthController.getUser(req, res));
router.get("/history/:userId", (req, res) => HistoryController.get(req, res));

export default router;
