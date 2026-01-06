// LockerController.js
import mongoose from "mongoose";
import Locker from "../models/Locker.js";
import History from "../models/History.js";

class LockerController {
  async update(req, res) {
    try {
      const { lockerId, status } = req.body;

      const ownerId = req.body.ownerId
        ? new mongoose.Types.ObjectId(req.body.ownerId)
        : null;

      // ✅ lấy trạng thái hiện tại để log history đúng user
      const current = await Locker.findOne({ lockerId }).lean();

      // ✅ LOG HISTORY: cả LOCKED + OPEN
      if (status === "LOCKED") {
        if (current && current.ownerId) {
          await new History({
            userId: current.ownerId,
            lockerId,
            action: "LOCKED",
          }).save();
        }
      }

      if (status === "OPEN") {
        const uid = ownerId || current?.ownerId || null;
        if (uid) {
          await new History({
            userId: uid,
            lockerId,
            action: "OPEN", // ✅ để frontend tô xanh OPEN luôn
          }).save();
        }
      }

      const updated = await Locker.findOneAndUpdate(
        { lockerId },
        { status, ownerId, timestamp: new Date() },
        { new: true }
      ).lean();

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Không tìm thấy tủ: " + lockerId });
      }

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
