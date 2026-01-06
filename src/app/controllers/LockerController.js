// src/app/controllers/LockerController.js
import mongoose from "mongoose";
import Locker from "../models/Locker.js";
import History from "../models/History.js";

function normalizeStatus(s) {
  const v = String(s || "")
    .toUpperCase()
    .trim();

  // bạn có thể mở rộng thêm tuỳ frontend gửi gì
  if (["OPEN", "OPENED", "UNLOCK", "UNLOCKED"].includes(v)) return "OPENED";
  if (["LOCK", "LOCKED", "CLOSE", "CLOSED"].includes(v)) return "LOCKED";

  // giữ nguyên nếu là trạng thái khác (EMPTY/USING/...)
  return v || "UNKNOWN";
}

class LockerController {
  // GET /lockers/status
  async status(req, res) {
    try {
      // đảm bảo luôn có 01..06
      const all = await Locker.find().lean();
      for (let i = 1; i <= 6; i++) {
        const id = i.toString().padStart(2, "0");
        const exists = all.find((l) => l.lockerId === id);
        if (!exists) {
          await Locker.updateOne(
            { lockerId: id },
            { $setOnInsert: { lockerId: id, status: "EMPTY", ownerId: null } },
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

  // POST /lockers/update
  async update(req, res) {
    try {
      const { lockerId } = req.body || {};
      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }

      const status = normalizeStatus(req.body?.status);

      // user thao tác (để log lịch sử)
      const actorId = req.user?._id || req.user?.id || req.user?.userId || null;

      // lấy locker hiện tại để:
      // 1) giữ ownerId nếu request không gửi
      // 2) log đúng theo chủ tủ nếu cần
      const current = await Locker.findOne({ lockerId }).lean();
      if (!current) {
        return res
          .status(404)
          .json({ success: false, error: "Không tìm thấy tủ: " + lockerId });
      }

      // ownerId: chỉ update nếu client gửi ownerId (tránh bị null khi mở tủ)
      let nextOwnerId = current.ownerId || null;
      if (req.body?.ownerId) {
        nextOwnerId = new mongoose.Types.ObjectId(req.body.ownerId);
      }

      // ✅ LOG HISTORY: cả OPENED và LOCKED
      // - ưu tiên log theo actor (người đang mở/đóng)
      // - fallback về ownerId hiện tại của tủ
      const historyUserId = actorId || current.ownerId || nextOwnerId || null;

      if (historyUserId && (status === "LOCKED" || status === "OPENED")) {
        await new History({
          userId: historyUserId,
          lockerId,
          action: status, // "LOCKED" hoặc "OPENED"
          timestamp: new Date(),
        }).save();
      }

      const updated = await Locker.findOneAndUpdate(
        { lockerId },
        { status, ownerId: nextOwnerId, timestamp: new Date() },
        { new: true }
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
}

export default new LockerController();
