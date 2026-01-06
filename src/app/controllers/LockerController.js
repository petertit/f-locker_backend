// src/app/controllers/LockerController.js
import LockerState from "../models/LockerState.js"; // giữ đúng path model của bạn
import History from "../models/History.js"; // giữ đúng path model của bạn

function upper(s) {
  return String(s || "")
    .trim()
    .toUpperCase();
}

// map các status frontend -> status hợp lệ theo enum của LockerState
function normalizeLockerStatus(input, allowedEnums = []) {
  const s = upper(input);

  // các alias phổ biến từ frontend
  const aliasToCanonical = {
    OPENED: "OPEN", // nhiều schema dùng OPEN thay vì OPENED
    UNLOCKED: "OPEN",
    UNLOCK: "OPEN",
    OPEN: "OPEN",

    CLOSED: "LOCKED",
    CLOSE: "LOCKED",
    LOCK: "LOCKED",
    LOCKED: "LOCKED",
  };

  let candidate = aliasToCanonical[s] || s;

  // nếu schema có đúng candidate thì dùng luôn
  if (allowedEnums.includes(candidate)) return candidate;

  // fallback thông minh theo schema enum thực tế
  // nếu schema dùng "OPENED" (hiếm) thì convert ngược
  if (candidate === "OPEN" && allowedEnums.includes("OPENED")) return "OPENED";
  if (candidate === "LOCKED" && allowedEnums.includes("CLOSED"))
    return "CLOSED";

  // nếu schema dùng UNLOCKED thay OPEN
  if (candidate === "OPEN" && allowedEnums.includes("UNLOCKED"))
    return "UNLOCKED";

  // không khớp thì trả nguyên candidate để validate lỗi rõ ràng
  return candidate;
}

// map status -> action history (History.js của bạn đang có OPENED / LOCKED)
function normalizeHistoryActionFromStatus(status, allowedActions = []) {
  const s = upper(status);

  // ưu tiên OPENED/LOCKED theo UI của bạn
  let action =
    s === "OPEN" || s === "UNLOCKED" || s === "OPENED" ? "OPENED" : "LOCKED";

  if (allowedActions.includes(action)) return action;

  // fallback nếu enum history khác
  if (action === "OPENED" && allowedActions.includes("OPEN")) return "OPEN";
  if (action === "LOCKED" && allowedActions.includes("CLOSED")) return "CLOSED";

  return action;
}

class LockerController {
  // GET /lockers/status?lockerId=06
  async status(req, res) {
    try {
      const lockerId = String(req.query?.lockerId || "").trim();
      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId (query)" });
      }

      const doc = await LockerState.findOne({ lockerId }).lean();
      // nếu chưa có record thì coi như LOCKED (đóng)
      return res.json({
        success: true,
        lockerId,
        status: doc?.status || "LOCKED",
        updatedAt: doc?.updatedAt || null,
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST /lockers/update  { lockerId: "06", status: "OPENED" }
  async update(req, res) {
    try {
      const lockerId = String(req.body?.lockerId || "").trim();
      const rawStatus = req.body?.status;

      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }
      if (!rawStatus) {
        return res
          .status(400)
          .json({ success: false, error: "Missing status" });
      }

      // lấy enum thật từ schema LockerState
      const allowedStatuses =
        LockerState?.schema?.path("status")?.enumValues || [];

      const status = normalizeLockerStatus(rawStatus, allowedStatuses);

      // nếu schema có enum mà status không hợp lệ -> báo rõ allowed
      if (allowedStatuses.length && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status: ${status}`,
          allowed: allowedStatuses,
          hint: "Frontend is sending OPENED. Your schema enum may be OPEN/UNLOCKED instead.",
        });
      }

      // lấy trạng thái cũ để tránh ghi history trùng
      const prev = await LockerState.findOne({ lockerId }).lean();
      const prevStatus = prev?.status || null;

      const updated = await LockerState.findOneAndUpdate(
        { lockerId },
        { $set: { status } },
        { new: true, upsert: true }
      ).lean();

      // ====== GHI LỊCH SỬ (OPEN + LOCK) ======
      // chỉ ghi nếu status thực sự thay đổi
      if (!prevStatus || prevStatus !== status) {
        const allowedActions =
          History?.schema?.path("action")?.enumValues || [];
        const action = normalizeHistoryActionFromStatus(status, allowedActions);

        // nếu History có enum mà action không hợp lệ -> bỏ qua lịch sử nhưng không làm fail update
        if (!allowedActions.length || allowedActions.includes(action)) {
          await History.create({
            userId: req.user?._id || req.user?.id, // tùy middleware authUser của bạn set gì
            lockerId,
            action, // OPENED / LOCKED
            timestamp: new Date(),
          });
        }
      }

      return res.json({
        success: true,
        lockerId,
        prevStatus,
        status: updated?.status,
        updatedAt: updated?.updatedAt || null,
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new LockerController();
