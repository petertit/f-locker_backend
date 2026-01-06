// src/app/controllers/LockerController.js
import mongoose from "mongoose";
import Locker from "../models/Locker.js";
import History from "../models/History.js";

/**
 * Status chuẩn để Frontend hiểu UI
 * - EMPTY: chưa ai đăng ký
 * - LOCKED: đã đăng ký & đang đóng
 * - OPENED: đã mở
 */
const VALID_STATUS = new Set(["EMPTY", "LOCKED", "OPENED"]);

function normalizeLockerId(v) {
  const s = String(v || "").trim();
  // chấp nhận "1" -> "01"
  if (/^\d$/.test(s)) return `0${s}`;
  return s;
}

function normalizeStatus(v) {
  const s = String(v || "")
    .trim()
    .toUpperCase();
  if (s === "OPEN" || s === "UNLOCK" || s === "UNLOCKED") return "OPENED";
  if (s === "CLOSE" || s === "LOCK") return "LOCKED";
  if (VALID_STATUS.has(s)) return s;
  return null;
}

async function ensureSeedLockers() {
  // bạn đang có 6 tủ
  const ids = ["01", "02", "03", "04", "05", "06"];

  await Promise.all(
    ids.map((id) =>
      Locker.updateOne(
        { lockerId: id },
        {
          $setOnInsert: {
            lockerId: id,
            status: "EMPTY",
            ownerId: null,
            passcode: null,
          },
        },
        { upsert: true }
      )
    )
  );
}

async function writeHistory({ lockerId, reqUser, action, meta }) {
  try {
    if (!lockerId) return;
    const userId =
      reqUser?._id && mongoose.isValidObjectId(reqUser._id)
        ? reqUser._id
        : null;

    await History.create({
      lockerId,
      userId,
      userEmail: reqUser?.email || null,
      action, // "REGISTERED" | "OPENED" | "LOCKED" | "UNREGISTERED"
      meta: meta || {},
    });
  } catch (e) {
    // không làm fail request chỉ vì history
    console.warn("History write failed:", e?.message);
  }
}

class LockerController {
  // GET /lockers/status
  async status(req, res) {
    try {
      await ensureSeedLockers();

      const lockers = await Locker.find({}, { __v: 0 })
        .sort({ lockerId: 1 })
        .lean();

      return res.json({ success: true, lockers });
    } catch (e) {
      console.error("Locker status error:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  /**
   * POST /lockers/update
   * Body hỗ trợ:
   * - lockerId (required)
   * - action: "register" | "unregister" | "setStatus"
   * - status: "OPENED" | "LOCKED" | "EMPTY"
   * - passcode: optional (khi register)
   */
  async update(req, res) {
    try {
      const rawLockerId = req.body?.lockerId;
      const lockerId = normalizeLockerId(rawLockerId);

      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }

      const action = String(req.body?.action || "setStatus").toLowerCase();

      // đảm bảo locker tồn tại
      await ensureSeedLockers();

      const locker = await Locker.findOne({ lockerId });
      if (!locker) {
        return res
          .status(404)
          .json({ success: false, error: "Locker not found" });
      }

      // ===== action: register =====
      if (action === "register") {
        // yêu cầu login
        if (!req.user?._id) {
          return res
            .status(401)
            .json({ success: false, error: "Unauthorized" });
        }

        // nếu locker đang thuộc người khác -> chặn
        if (locker.ownerId && String(locker.ownerId) !== String(req.user._id)) {
          return res.status(403).json({
            success: false,
            error: "Locker is already registered by another user",
          });
        }

        locker.ownerId = req.user._id;
        locker.status = "LOCKED";

        // passcode có thể lưu ở locker hoặc user, tùy bạn.
        if (req.body?.passcode != null) {
          locker.passcode = String(req.body.passcode);
        }

        await locker.save();

        await writeHistory({
          lockerId,
          reqUser: req.user,
          action: "REGISTERED",
          meta: { passcodeSet: req.body?.passcode != null },
        });

        return res.json({ success: true, locker });
      }

      // ===== action: unregister =====
      if (action === "unregister") {
        if (!req.user?._id) {
          return res
            .status(401)
            .json({ success: false, error: "Unauthorized" });
        }

        // chỉ chủ mới được hủy
        if (locker.ownerId && String(locker.ownerId) !== String(req.user._id)) {
          return res.status(403).json({
            success: false,
            error: "You are not the owner of this locker",
          });
        }

        locker.ownerId = null;
        locker.passcode = null;
        locker.status = "EMPTY";
        await locker.save();

        await writeHistory({
          lockerId,
          reqUser: req.user,
          action: "UNREGISTERED",
          meta: {},
        });

        return res.json({ success: true, locker });
      }

      // ===== action: setStatus (mở/đóng) =====
      const nextStatus = normalizeStatus(req.body?.status);
      if (!nextStatus) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed: ${Array.from(VALID_STATUS).join(
            ", "
          )}`,
        });
      }

      const prevStatus = locker.status || "EMPTY";
      locker.status = nextStatus;
      await locker.save();

      // log lịch sử mở/đóng
      if (nextStatus === "OPENED") {
        await writeHistory({
          lockerId,
          reqUser: req.user,
          action: "OPENED",
          meta: { prevStatus },
        });
      } else if (nextStatus === "LOCKED") {
        await writeHistory({
          lockerId,
          reqUser: req.user,
          action: "LOCKED",
          meta: { prevStatus },
        });
      }

      return res.json({ success: true, locker });
    } catch (e) {
      console.error("Locker update error:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new LockerController();
