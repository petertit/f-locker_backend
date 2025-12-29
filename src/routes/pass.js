import express from "express";
import PassController from "../app/controllers/PassController.js";
import { verifyJWT } from "../app/middlewares/authMiddleware.js";

const router = express.Router();
router.post("/verify", verifyJWT, (req, res) =>
  PassController.verify(req, res)
);
export default router;
