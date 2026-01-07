// src/routes/admin.js
import express from "express";
import authUser from "../app/middlewares/auth_user.js";
import adminOnly from "../app/middlewares/admin_only.js";
import AdminController from "../app/controllers/AdminController.js";

const router = express.Router();

router.get("/users", authUser, adminOnly, (req, res) =>
  AdminController.listUsers(req, res)
);

router.patch("/users/:id", authUser, adminOnly, (req, res) =>
  AdminController.updateUser(req, res)
);

router.delete("/users/:id", authUser, adminOnly, (req, res) =>
  AdminController.deleteUser(req, res)
);

export default router;
