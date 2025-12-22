import mongoose from "mongoose";
import Locker from "../models/Locker.js";
import History from "../models/History.js";

class LockerController {
  // GET /api/lockers/status
  async status(req, res) {
    try {
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

  // POST /api/lockers/update
  async update(req, res) {
    try {
      const { lockerId, status } = req.body;

      const ownerId = req.body.ownerId
        ? new mongoose.Types.ObjectId(req.body.ownerId)
        : null;
      // history
      if (status === "LOCKED") {
        const current = await Locker.findOne({ lockerId }).lean();
        if (current && current.ownerId) {
          await new History({
            userId: current.ownerId,
            lockerId,
            action: "LOCKED",
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
