// server/src/app/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    hint: String,
    lockerCode: { type: String, default: null },
    registeredLocker: { type: String, default: null },
  },
  { collection: "account" }
);

const User = mongoose.model("Account", userSchema);
export default User;
