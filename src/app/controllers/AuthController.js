// src/app/controllers/AuthController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import History from "../models/History.js";
import jwt from "jsonwebtoken";

// Nếu bạn dùng User cho login thì không cần Account riêng
// (giữ lại alias để khỏi phải sửa nhiều)
const Account = User;

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment");
  }

  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

// Chuẩn hoá dữ liệu user trả về frontend (không trả password)
const prepareUser = (acc) => {
  if (!acc) return null;

  const obj = acc.toObject ? acc.toObject() : { ...acc };

  // đảm bảo _id dạng string + có cả id cho frontend nào dùng id
  const idStr = obj._id?.toString?.() || obj.id || null;
  obj._id = idStr;
  obj.id = idStr;

  // không bao giờ trả password
  delete obj.password;

  // đảm bảo luôn có field để UI không bị "undefined"
  if (obj.lockerCode === undefined) obj.lockerCode = null;
  if (obj.registeredLocker === undefined) obj.registeredLocker = null;

  return obj;
};

class AuthController {
  // POST /auth/register (tuỳ routes bạn map)
  async register(req, res) {
    try {
      const { name, phone, password, hint } = req.body || {};
      const email = req.body?.email ? String(req.body.email).toLowerCase() : "";

      if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: "Thiếu thông tin cần thiết" });
      }

      const exist = await User.findOne({ email }).lean();
      if (exist) return res.status(400).json({ error: "Email đã tồn tại" });

      const acc = new User({
        name,
        email,
        phone,
        password, // ⚠️ nếu muốn an toàn: hash bcrypt
        hint: hint ?? null,
        lockerCode: null,
        registeredLocker: null,
      });

      await acc.save();

      // log lịch sử
      await new History({
        userId: acc._id,
        action: "REGISTERED",
      }).save();

      return res.json({
        success: true,
        message: "✅ Đăng ký thành công",
        user: prepareUser(acc),
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, error: "Missing email/password" });
      }

      const emailNorm = String(email).toLowerCase();

      // ⚠️ lean() => object thường, không phải mongoose doc
      const user = await Account.findOne({ email: emailNorm }).lean();
      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: "Email not found" });
      }

      // ⚠️ nếu dùng bcrypt thì thay bằng bcrypt.compare()
      const ok = String(user.password) === String(password);
      if (!ok) {
        return res
          .status(401)
          .json({ success: false, error: "Wrong password" });
      }

      const token = signToken(user);

      // log lịch sử
      try {
        await new History({
          userId: user._id,
          action: "LOGIN",
        }).save();
      } catch (_) {}

      // ✅ QUAN TRỌNG: trả về lockerCode + registeredLocker
      return res.json({
        success: true,
        token,
        user: prepareUser(user),
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /auth/update
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
      } = req.body || {};

      if (!id)
        return res.status(400).json({ success: false, error: "Missing id" });

      const fields = {};
      if (name !== undefined) fields.name = name;
      if (email !== undefined) fields.email = String(email).toLowerCase();
      if (phone !== undefined) fields.phone = phone;
      if (password !== undefined) fields.password = password;
      if (hint !== undefined) fields.hint = hint;

      // ✅ 2 field quan trọng của bạn
      if (lockerCode !== undefined) fields.lockerCode = lockerCode;
      if (registeredLocker !== undefined)
        fields.registeredLocker = registeredLocker;

      const updated = await User.findByIdAndUpdate(
        id,
        { $set: fields },
        { new: true }
      );

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // log lịch sử nếu có update locker
      if (lockerCode !== undefined || registeredLocker !== undefined) {
        try {
          await new History({
            userId: updated._id,
            action: "UPDATED",
          }).save();
        } catch (_) {}
      }

      return res.json({
        success: true,
        message: "✅ Updated successfully",
        user: prepareUser(updated),
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /auth/user/:id
  async getUser(req, res) {
    try {
      const userIdObject = new mongoose.Types.ObjectId(req.params.id);
      const user = await User.findById(userIdObject).lean();
      if (!user)
        return res
          .status(404)
          .json({ success: false, error: "User not found" });

      return res.json({ success: true, user: prepareUser(user) });
    } catch (err) {
      if (err instanceof mongoose.Error.CastError) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user ID format" });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new AuthController();
