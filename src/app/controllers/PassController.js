// src/app/controllers/PassController.js
import User from "../models/User.js";

class PassController {
  // POST /pass/verify
  async verify(req, res) {
    try {
      const userId = req.user?.id || req.user?._id || req.userId;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, error: "Missing token / Unauthorized" });
      }

      const { lockerId, lockerCode } = req.body;

      if (!lockerId || !lockerCode) {
        return res.status(400).json({
          success: false,
          error: "Missing lockerId or lockerCode",
        });
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const dbCode = String(user.lockerCode || "");
      const inputCode = String(lockerCode || "");

      if (dbCode !== inputCode) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid locker code" });
      }

      const registered =
        user.registeredLocker || user.lockerId || user.locker || null;

      if (registered && String(registered) !== String(lockerId)) {
        return res.status(403).json({
          success: false,
          error: "This locker is not registered to your account",
        });
      }

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new PassController();
