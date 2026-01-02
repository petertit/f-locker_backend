// src/app/controllers/RaspiController.js

import FormData from "form-data";
import fetch from "node-fetch"; // nếu Node < 18
// Nếu Node >= 18 thì có thể bỏ import này

const RASPI_URL = process.env.RASPI_URL;

class RaspiController {
  /**
   * POST /raspi/recognize-remote
   * multipart/form-data:
   *  - image: file (jpeg)
   *  - lockerId?: string
   */
  async recognizeRemote(req, res) {
    try {
      // ===== 1. Validate =====
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Missing image file",
        });
      }

      if (!RASPI_URL) {
        return res.status(500).json({
          success: false,
          error: "RASPI_URL not configured",
        });
      }

      const lockerId = req.body.lockerId || null;

      // ===== 2. Build form-data gửi sang Raspi =====
      const form = new FormData();

      form.append("image", req.file.buffer, {
        filename: "frame.jpg",
        contentType: req.file.mimetype || "image/jpeg",
      });

      if (lockerId) {
        form.append("lockerId", lockerId);
      }

      // ===== 3. Forward sang Raspberry Pi =====
      const raspiRes = await fetch(`${RASPI_URL}/recognize`, {
        method: "POST",
        body: form,
        headers: {
          ...form.getHeaders(), // ⚠️ CỰC KỲ QUAN TRỌNG
        },
        timeout: 10_000, // 10s
      });

      // ===== 4. Đọc response Raspi =====
      const contentType = raspiRes.headers.get("content-type") || "";

      let raspiData;
      if (contentType.includes("application/json")) {
        raspiData = await raspiRes.json();
      } else {
        const text = await raspiRes.text();
        throw new Error("Raspi response not JSON: " + text.slice(0, 100));
      }

      // ===== 5. Raspi báo lỗi =====
      if (!raspiRes.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi error",
          raspi: raspiData,
        });
      }

      /**
       * Giả sử Raspi trả:
       * {
       *   matched: true,
       *   lockerId: "06",
       *   confidence: 0.92
       * }
       */

      // ===== 6. Thành công =====
      return res.json({
        success: true,
        matched: raspiData.matched === true,
        lockerId: raspiData.lockerId || lockerId,
        confidence: raspiData.confidence || null,
      });
    } catch (err) {
      console.error("❌ recognizeRemote error:", err);

      return res.status(500).json({
        success: false,
        error: err.message || "Internal Server Error",
      });
    }
  }
}

export default new RaspiController();
