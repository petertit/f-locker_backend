// src/app/controllers/LockerController.js
import mongoose from "mongoose";
import Locker from "../models/Locker.js";
import History from "../models/History.js";
import User from "../models/User.js";

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

async function ensure6LockersExist() {
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
            timestamp: new Date(),
            lastActiveAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }
}

/**
 * Đồng bộ/cleanup dữ liệu sai:
 * - Nếu locker_states có ownerId nhưng user không tồn tại -> reset EMPTY
 * - Nếu user tồn tại nhưng registeredLocker != lockerId -> reset EMPTY
 */
async function cleanupInconsistentOwners() {
  const lockers = await Locker.find({ ownerId: { $ne: null } }).lean();
  if (!lockers.length) return;

  for (const l of lockers) {
    const ownerIdStr = String(l.ownerId);

    const user = await User.findById(ownerIdStr)
      .select("_id registeredLocker")
      .lean();

    const userExists = !!user;
    const userMatches =
      userExists &&
      user.registeredLocker &&
      String(user.registeredLocker) === String(l.lockerId);

    // ✅ Nếu không có user hoặc user không match locker => reset
    if (!userExists || !userMatches) {
      await Locker.updateOne(
        { lockerId: l.lockerId },
        {
          $set: {
            status: "EMPTY",
            ownerId: null,
            timestamp: new Date(),
            lastActiveAt: new Date(),
          },
        }
      );
    }
  }
}

class LockerController {
  // GET /lockers/status
  async status(req, res) {
    try {
      await ensure6LockersExist();

      // ✅ dọn dữ liệu sai (case bạn gặp)
      await cleanupInconsistentOwners();

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

      // history
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
          lastActiveAt: new Date(),
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

  // POST /lockers/touch
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

      const userId = req.user?.id;
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
