// src/app/controllers/RaspiController.js
import { recognizeRemoteOnRaspi } from "../../services/raspi_service.js";

class RaspiController {
  async status(req, res) {
    return res.json({ success: true, message: "Raspi route OK" });
  }

  // các hàm lock/unlock/capture của bạn giữ nguyên nếu đang chạy
  async lock(req, res) {
    return res
      .status(501)
      .json({ success: false, error: "Not implemented here" });
  }

  async unlock(req, res) {
    return res
      .status(501)
      .json({ success: false, error: "Not implemented here" });
  }

  async capture(req, res) {
    return res
      .status(501)
      .json({ success: false, error: "Not implemented here" });
  }

  // ✅ POST /raspi/recognize-remote
  // nhận multipart/form-data field: image
  async recognizeRemote(req, res) {
    try {
      const raspiBaseUrl = process.env.RASPI_URL; // ví dụ: http://<raspi-ip>:5000
      const lockerId = req.body?.lockerId || null;

      // auth_user.js của bạn sẽ set req.user nếu token hợp lệ
      const userEmail = req.user?.email || req.body?.user || null;

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          error: "Missing image file (field name must be 'image')",
        });
      }

      // buffer từ multer memoryStorage
      const buffer = req.file.buffer;
      const mimetype = req.file.mimetype || "image/jpeg";
      const filename = req.file.originalname || "frame.jpg";

      // forward sang raspi
      const result = await recognizeRemoteOnRaspi({
        raspiBaseUrl,
        buffer,
        mimetype,
        filename,
        lockerId,
        userEmail,
      });

      // payload có thể là json/text
      const payload = result?.payload?.data;

      // Chuẩn hoá output: bạn tuỳ Raspi trả gì thì map lại ở đây
      // Mình đoán các field thường gặp: success/matched/name/confidence/lockerId
      const matched =
        payload?.matched === true ||
        payload?.success === true ||
        payload?.ok === true ||
        payload?.result === true;

      return res.json({
        success: true,
        matched,
        lockerId: payload?.lockerId || lockerId || null,
        data: payload || null,
        via: { path: result?.path || null },
      });
    } catch (err) {
      // 405/404/timeout... => trả về cho frontend thấy rõ
      return res.status(502).json({
        success: false,
        error: "Raspi recognize failed",
        detail: err?.message || String(err),
      });
    }
  }
}

export default new RaspiController();
