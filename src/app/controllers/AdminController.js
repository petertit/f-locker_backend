// src/app/controllers/AdminController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Locker from "../models/Locker.js";

class AdminController {
  // GET /admin/users
  async listUsers(req, res) {
    try {
      // Lấy users
      const users = await User.find()
        .select("_id name username email phone createdAt")
        .sort({ createdAt: -1 })
        .lean();

      // Lấy lockers để biết ai đang giữ tủ nào
      const lockers = await Locker.find()
        .select("lockerId status ownerId")
        .lean();

      const ownerMap = new Map();
      for (const l of lockers) {
        if (l.ownerId) ownerMap.set(String(l.ownerId), l);
      }

      const result = users.map((u) => {
        const lk = ownerMap.get(String(u._id)) || null;
        return {
          _id: u._id,
          name: u.name || "",
          username: u.username || "",
          email: u.email || "",
          phone: u.phone || "",
          createdAt: u.createdAt,
          locker: lk
            ? { lockerId: lk.lockerId, status: lk.status }
            : { lockerId: null, status: null },
        };
      });

      return res.json({ success: true, users: result });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // PATCH /admin/users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user id" });
      }

      const { name, username, email, phone } = req.body || {};

      // Không cho sửa email của admin (tránh tự khóa)
      const target = await User.findById(id).select("email").lean();
      if (!target)
        return res
          .status(404)
          .json({ success: false, error: "User not found" });

      const targetEmail = (target.email || "").toLowerCase();
      if (
        targetEmail === "admin@gmail.com" &&
        email &&
        email.toLowerCase() !== "admin@gmail.com"
      ) {
        return res
          .status(400)
          .json({ success: false, error: "Cannot change admin email" });
      }

      const patch = {};
      if (typeof name === "string") patch.name = name;
      if (typeof username === "string") patch.username = username;
      if (typeof email === "string") patch.email = email;
      if (typeof phone === "string") patch.phone = phone;

      const updated = await User.findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      })
        .select("_id name username email phone createdAt")
        .lean();

      return res.json({ success: true, user: updated });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // DELETE /admin/users/:id
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user id" });
      }

      const user = await User.findById(id).select("email").lean();
      if (!user)
        return res
          .status(404)
          .json({ success: false, error: "User not found" });

      const email = (user.email || "").toLowerCase();
      if (email === "admin@gmail.com") {
        return res
          .status(400)
          .json({ success: false, error: "Cannot delete admin account" });
      }

      // Nếu user đang giữ tủ, trả tủ về EMPTY
      await Locker.updateMany(
        { ownerId: id },
        { $set: { ownerId: null, status: "EMPTY", timestamp: new Date() } }
      );

      await User.deleteOne({ _id: id });

      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new AdminController();
