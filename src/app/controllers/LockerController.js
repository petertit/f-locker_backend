// src/app/controllers/LockerController.js
import mongoose from "mongoose";
import Locker from "../models/Locker.js";
import History from "../models/History.js";

function normalizeLockerStatus(raw) {
  const s = String(raw || "")
    .trim()
    .toUpperCase();

  // Frontend hay gửi OPENED -> nhưng Locker schema chỉ nhận OPEN
  if (s === "OPENED") return "OPEN";
  if (s === "OPEN") return "OPEN";

  if (s === "LOCKED") return "LOCKED";
  if (s === "CLOSED" || s === "CLOSE") return "LOCKED";

  if (s === "EMPTY" || s === "AVAILABLE" || s === "FREE") return "EMPTY";

  return s; // để mongoose tự validate nếu giá trị lạ
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

      const incomingStatus = req.body?.status;
      const status = normalizeLockerStatus(incomingStatus);

      // ownerId: nếu FE gửi thì dùng; nếu không gửi thì giữ nguyên (trừ khi EMPTY -> null)
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

      // nếu FE có gửi ownerId thì ưu tiên theo FE (đăng ký tủ / gán chủ)
      if (ownerIdFromBody) nextOwnerId = ownerIdFromBody;

      // nếu EMPTY thì xóa owner
      if (status === "EMPTY") nextOwnerId = null;

      // ===== GHI HISTORY ĐỦ CẢ OPEN + LOCK =====
      // History schema action của bạn: OPENED | LOCKED
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

      // cập nhật locker
      const updated = await Locker.findOneAndUpdate(
        { lockerId },
        {
          status,
          ownerId: nextOwnerId,
          timestamp: new Date(),
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
}

export default new LockerController();
