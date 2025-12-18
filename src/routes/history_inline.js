// server/src/routes/history_inline.js
import mongoose from "mongoose";
import History from "../app/models/History.js";

export default {
  async get(req, res) {
    try {
      const userIdObject = new mongoose.Types.ObjectId(req.params.userId);
      const history = await History.find({ userId: userIdObject }).sort({
        timestamp: -1,
      });
      return res.json({ success: true, history });
    } catch (err) {
      if (err instanceof mongoose.Error.CastError) {
        return res
          .status(400)
          .json({ error: "Invalid user ID format for history lookup" });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
