// src/app/controllers/RaspiController.js
import RaspiService from "../../services/raspi_service.js";

const raspiService = new RaspiService();

// ✅ Bạn chỉnh đúng path API của Raspberry Pi ở đây (hoặc set env)
const PATHS = {
  lock: process.env.RASPI_LOCK_PATH || "/lock",
  unlock: process.env.RASPI_UNLOCK_PATH || "/unlock",
  recognize: process.env.RASPI_RECOGNIZE_PATH || "/recognize", // Raspi API endpoint thật
};

// Helper: parse JSON body safely
function getJsonBody(req) {
  return req.body && typeof req.body === "object" ? req.body : {};
}

// Helper: Buffer from base64 dataURL or raw base64
function bufferFromBase64(input) {
  if (!input) return null;
  let b64 = String(input);

  // data:image/jpeg;base64,...
  const m = b64.match(/^data:.*?;base64,(.+)$/);
  if (m) b64 = m[1];

  try {
    return Buffer.from(b64, "base64");
  } catch {
    return null;
  }
}

class RaspiController {
  // POST /raspi/lock
  async lock(req, res) {
    try {
      const { lockerId, user } = getJsonBody(req);
      if (!lockerId)
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });

      const r = await raspiService.forwardJson(PATHS.lock, { lockerId, user });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi lock failed",
          detail: r.json || r.text || `HTTP ${r.status}`,
          raspiUrl: r.url,
        });
      }

      return res.json({ success: true, data: r.json || { ok: true } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST /raspi/unlock
  async unlock(req, res) {
    try {
      const { lockerId, user } = getJsonBody(req);
      if (!lockerId)
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });

      const r = await raspiService.forwardJson(PATHS.unlock, {
        lockerId,
        user,
      });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi unlock failed",
          detail: r.json || r.text || `HTTP ${r.status}`,
          raspiUrl: r.url,
        });
      }

      return res.json({ success: true, data: r.json || { ok: true } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  /**
   * POST /raspi/recognize-remote
   * Frontend gửi JSON:
   * {
   *   imageBase64: "data:image/jpeg;base64,..."
   *   lockerId: "06"
   * }
   *
   * Backend sẽ forward sang Raspi API dạng multipart (FormData)
   * - field: image (file)
   * - lockerId (optional)
   */
  async recognizeRemote(req, res) {
    try {
      const body = getJsonBody(req);
      const lockerId = body.lockerId || null;
      const imageBase64 = body.imageBase64 || body.image || null;

      if (!imageBase64) {
        return res
          .status(400)
          .json({ success: false, error: "Missing imageBase64" });
      }

      const buf = bufferFromBase64(imageBase64);
      if (!buf || buf.length < 10) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid base64 image" });
      }

      // ✅ Build multipart using native FormData/Blob
      const fd = new FormData();
      fd.append("image", new Blob([buf], { type: "image/jpeg" }), "frame.jpg");
      if (lockerId) fd.append("lockerId", String(lockerId));

      const r = await raspiService.forwardFormData(PATHS.recognize, fd, {
        timeoutMs: 15000,
      });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi recognize failed",
          detail: r.json || r.text || `HTTP ${r.status}`,
          raspiUrl: r.url,
        });
      }

      // Raspi nên trả JSON: { success:true, matched:true, lockerId:"06" ... }
      return res.json(r.json || { success: true });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new RaspiController();
