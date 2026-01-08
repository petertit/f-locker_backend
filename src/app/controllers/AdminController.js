// src/app/controllers/AdminController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Locker from "../models/Locker.js";

class AdminController {
  // GET /admin/users
  async listUsers(req, res) {
    try {
      // ✅ bỏ username (vì schema User không có username) :contentReference[oaicite:3]{index=3}
      // ✅ thêm lockerCode + registeredLocker để admin quản lý
      const users = await User.find()
        .select("_id name email phone lockerCode registeredLocker createdAt")
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
          email: u.email || "",
          phone: u.phone || "",
          lockerCode: u.lockerCode ?? null,
          registeredLocker: u.registeredLocker ?? null,
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

      // ✅ admin được phép sửa lockerCode
      // ✅ xóa username (không nhận, không lưu)
      const { name, email, phone, lockerCode, registeredLocker } =
        req.body || {};

      // Không cho sửa email của admin (tránh tự khóa)
      const target = await User.findById(id).select("email").lean();
      if (!target) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

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
      if (typeof email === "string") patch.email = email.toLowerCase();
      if (typeof phone === "string") patch.phone = phone;

      // ✅ Cho phép admin cập nhật lockerCode
      if (lockerCode !== undefined) patch.lockerCode = lockerCode;

      // (optional) nếu admin muốn chỉnh tủ đã đăng ký của user
      // ⚠️ nếu bạn muốn khóa cứng không cho admin sửa registeredLocker thì comment 2 dòng dưới
      if (registeredLocker !== undefined)
        patch.registeredLocker = registeredLocker;

      const updated = await User.findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      })
        .select("_id name email phone lockerCode registeredLocker createdAt")
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

      const user = await User.findById(id)
        .select("email registeredLocker")
        .lean();

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const email = (user.email || "").toLowerCase();
      if (email === "admin@gmail.com") {
        return res
          .status(400)
          .json({ success: false, error: "Cannot delete admin account" });
      }

      // ✅ TRẢ TỦ VỀ TRỐNG: xoá ownerId + set EMPTY
      // 1) Nếu user đang là ownerId của bất kỳ locker nào
      await Locker.updateMany(
        { ownerId: id },
        {
          $set: {
            ownerId: null,
            status: "EMPTY",
            timestamp: new Date(),
            lastActiveAt: new Date(),
          },
        }
      );

      // 2) Nếu bạn có logic registeredLocker nhưng locker_states chưa đúng,
      // vẫn có thể reset thêm theo registeredLocker (best-effort)
      if (user.registeredLocker) {
        await Locker.updateOne(
          { lockerId: String(user.registeredLocker) },
          {
            $set: {
              ownerId: null,
              status: "EMPTY",
              timestamp: new Date(),
              lastActiveAt: new Date(),
            },
          }
        );
      }

      // ✅ XÓA USER
      await User.deleteOne({ _id: id });

      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new AdminController();
