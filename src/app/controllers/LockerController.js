// src/app/controllers/LockerController.js
import mongoose from "mongoose";
import Locker from "../models/Locker.js";
import History from "../models/History.js";

function normalizeLockerStatus(raw) {
  const s = String(raw || "")
    .trim()
    .toUpperCase();

  if (s === "OPENED") return "OPEN";
  if (s === "OPEN") return "OPEN";

  if (s === "LOCKED") return "LOCKED";
  if (s === "CLOSED" || s === "CLOSE") return "LOCKED";

  if (s === "EMPTY" || s === "AVAILABLE" || s === "FREE") return "EMPTY";

  return s;
}

class LockerController {
  // GET /lockers/status
  async status(req, res) {
    try {
      // đảm bảo đủ 6 lockers
      const all = await Locker.find().lean();
      for (let i = 1; i <= 6; i++) {
        const id = i.toString().padStart(2, "0");
        const exists = all.find((l) => l.lockerId === id);
        if (!exists) {
          await Locker.updateOne(
            { lockerId: id },
            {
              $setOnInsert: {
                lockerId: id,
                status: "EMPTY",
                ownerId: null,
                lastActiveAt: new Date(), // ✅ NEW
                timestamp: new Date(),
              },
            },
            { upsert: true }
          );
        }
      }

      const finalLockers = await Locker.find().lean();
      return res.json({
        success: true,
        lockers: finalLockers.map((l) => ({
          lockerId: l.lockerId,
          status: l.status,
          ownerId: l.ownerId ? l.ownerId.toString() : null,
        })),
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Lỗi khi tải trạng thái tủ: " + err.message,
      });
    }
  }

  // POST /lockers/update  (protected)
  async update(req, res) {
    try {
      const { lockerId } = req.body || {};
      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }

      const incomingStatus = req.body?.status;
      const status = normalizeLockerStatus(incomingStatus);

      const ownerIdFromBody = req.body?.ownerId
        ? new mongoose.Types.ObjectId(req.body.ownerId)
        : null;

      const current = await Locker.findOne({ lockerId }).lean();
      if (!current) {
        return res
          .status(404)
          .json({ success: false, error: "Không tìm thấy tủ: " + lockerId });
      }

      let nextOwnerId = current.ownerId || null;
      if (ownerIdFromBody) nextOwnerId = ownerIdFromBody;
      if (status === "EMPTY") nextOwnerId = null;

      // ===== HISTORY OPEN + LOCK =====
      if (current.ownerId) {
        if (status === "OPEN") {
          await new History({
            userId: current.ownerId,
            lockerId,
            action: "OPENED",
          }).save();
        } else if (status === "LOCKED") {
          await new History({
            userId: current.ownerId,
            lockerId,
            action: "LOCKED",
          }).save();
        }
      }

      const updated = await Locker.findOneAndUpdate(
        { lockerId },
        {
          status,
          ownerId: nextOwnerId,
          timestamp: new Date(),
          lastActiveAt: new Date(), // ✅ NEW (mọi update đều “touch”)
        },
        { new: true, runValidators: true }
      ).lean();

      return res.json({
        success: true,
        locker: {
          lockerId: updated.lockerId,
          status: updated.status,
          ownerId: updated.ownerId ? updated.ownerId.toString() : null,
        },
      });
    } catch (err) {
      if (err instanceof mongoose.Error.CastError) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid owner ID format" });
      }
      return res.status(500).json({
        success: false,
        error: "Lỗi khi cập nhật trạng thái tủ: " + err.message,
      });
    }
  }

  // POST /lockers/touch  (protected)
  async touch(req, res) {
    try {
      const { lockerId } = req.body || {};
      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }

      const current = await Locker.findOne({ lockerId }).lean();
      if (!current) {
        return res
          .status(404)
          .json({ success: false, error: "Không tìm thấy tủ: " + lockerId });
      }

      // ✅ Chỉ cho OWNER touch (tránh người khác giữ sống session)
      const userId = req.user?.id; // từ auth_user.js :contentReference[oaicite:2]{index=2}
      const isOwner =
        current.ownerId && userId && String(current.ownerId) === String(userId);

      const isAdmin =
        (req.user?.email || "").toLowerCase() === "admin@gmail.com";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, error: "Not owner" });
      }

      await Locker.updateOne(
        { lockerId },
        { $set: { lastActiveAt: new Date() } }
      );

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new LockerController();
