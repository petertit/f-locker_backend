// server/src/app/controllers/AuthController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import History from "../models/History.js";

const prepareUser = (acc) => {
  if (!acc) return null;
  const obj = acc.toObject ? acc.toObject() : acc;

  obj.id = obj._id?.toString?.() || obj.id;
  delete obj._id;

  if (obj.lockerCode === undefined) obj.lockerCode = null;
  if (obj.registeredLocker === undefined) obj.registeredLocker = null;

  return obj;
};

class AuthController {
  // POST /register
  async register(req, res) {
    try {
      const { name, phone, password, hint } = req.body;
      const email = req.body.email ? req.body.email.toLowerCase() : null;

      if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: "Thiếu thông tin cần thiết" });
      }

      const exist = await User.findOne({ email });
      if (exist) return res.status(400).json({ error: "Email đã tồn tại" });

      const acc = new User({
        name,
        email,
        phone,
        password,
        hint,
        lockerCode: null,
        registeredLocker: null,
      });
      await acc.save();

      await new History({
        userId: acc._id,
        action: "REGISTERED",
      }).save();
      return res.json({
        message: "✅ Đăng ký thành công",
        user: prepareUser(acc),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /login
  async login(req, res) {
    try {
      const { password } = req.body;
      const email = req.body.email ? req.body.email.toLowerCase() : null;

      const acc = await User.findOne({ email, password }).lean();
      if (!acc)
        return res.status(401).json({ error: "Sai thông tin đăng nhập" });

      return res.json({
        message: "✅ Đăng nhập thành công",
        user: prepareUser(acc),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /update
  async update(req, res) {
    try {
      const {
        id,
        name,
        email,
        phone,
        password,
        hint,
        lockerCode,
        registeredLocker,
      } = req.body;

      const fields = {};
      if (name !== undefined) fields.name = name;
      if (email !== undefined) fields.email = email.toLowerCase();
      if (phone !== undefined) fields.phone = phone;
      if (password !== undefined) fields.password = password;
      if (hint !== undefined) fields.hint = hint;
      if (lockerCode !== undefined) fields.lockerCode = lockerCode;
      if (registeredLocker !== undefined)
        fields.registeredLocker = registeredLocker;

      const updated = await User.findByIdAndUpdate(
        id,
        { $set: fields },
        { new: true }
      ).lean();
      if (!updated) return res.status(404).json({ error: "User not found" });

      return res.json({
        message: "✅ Updated successfully",
        user: prepareUser(updated),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /user/:id
  async getUser(req, res) {
    try {
      const userIdObject = new mongoose.Types.ObjectId(req.params.id);
      const user = await User.findById(userIdObject).lean();
      if (!user) return res.status(404).json({ error: "User not found" });

      return res.json({ user: prepareUser(user) });
    } catch (err) {
      if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new AuthController();
