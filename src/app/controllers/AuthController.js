// server/src/app/controllers/AuthController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import History from "../models/History.js";
import jwt from "jsonwebtoken";
import Account from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}
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
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "Missing email/password" });
      }

      const user = await Account.findOne({ email }).lean();
      if (!user) return res.status(401).json({ error: "Email not found" });

      // ⚠️ Nếu bạn đang dùng bcrypt: thay bằng bcrypt.compare(password, user.password)
      const ok = String(user.password) === String(password);
      if (!ok) return res.status(401).json({ error: "Wrong password" });

      const token = signToken(user);

      // Trả user "safe" (không trả password)
      return res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          hint: user.hint || null,
          registeredLocker: user.registeredLocker ?? null,
        },
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
