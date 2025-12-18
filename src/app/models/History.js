// server/src/app/models/History.js
import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    lockerId: { type: String, default: null },
    action: { type: String, enum: ["REGISTERED", "OPENED", "LOCKED"] },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "history" }
);

const History = mongoose.model("History", historySchema);
export default History;
