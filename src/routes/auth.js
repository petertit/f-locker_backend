import express from "express";
import AuthController from "../app/controllers/AuthController.js";
import HistoryController from "./history_inline.js";
import authUser from "../app/middlewares/auth_user.js";

const router = express.Router();

router.post("/register", (req, res) => AuthController.register(req, res));
router.post("/login", (req, res) => AuthController.login(req, res));
router.post("/update", authUser, (req, res) => AuthController.update(req, res));
router.get("/user/:id", authUser, (req, res) =>
  AuthController.getUser(req, res)
);

router.get("/history/:userId", authUser, (req, res) =>
  HistoryController.get(req, res)
);

export default router;
