// server/src/app/models/Locker.js
import mongoose from "mongoose";

const lockerStateSchema = new mongoose.Schema(
  {
    lockerId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["EMPTY", "LOCKED", "OPEN"],
      default: "EMPTY",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "locker_states" }
);

const Locker = mongoose.model("LockerState", lockerStateSchema);
export default Locker;
