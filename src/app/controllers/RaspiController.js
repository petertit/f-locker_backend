// server/src/app/controllers/RaspiController.js
import raspiService from "../services/raspi_service.js";

class RaspiController {
  async status(req, res) {
    try {
      const data = await raspiService.forwardGet("/status");
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async unlock(req, res) {
    try {
      const data = await raspiService.forwardPost("/unlock", req.body);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async lock(req, res) {
    try {
      const data = await raspiService.forwardPost("/lock", req.body);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ✅ POST /raspi/recognize-remote
  // nhận ảnh từ frontend (multer), forward sang Raspi để nhận diện
  async recognizeRemote(req, res) {
    try {
      if (!req.file || !req.file.buffer) {
        return res
          .status(400)
          .json({ success: false, error: "Missing image file (field: image)" });
      }

      const lockerId = req.body?.lockerId || null;

      // ✅ forward multipart lên Raspi bằng FormData native (Node 18+ / 22 OK)
      const fd = new FormData();
      fd.append(
        "image",
        new Blob([req.file.buffer], {
          type: req.file.mimetype || "image/jpeg",
        }),
        "frame.jpg"
      );
      if (lockerId) fd.append("lockerId", String(lockerId));

      // timeout để tránh treo
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 12000);

      const raspiRes = await fetch(`${process.env.RASPI_URL}/recognize`, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      }).finally(() => clearTimeout(t));

      const ct = raspiRes.headers.get("content-type") || "";
      const text = await raspiRes.text();

      if (!raspiRes.ok) {
        return res.status(502).json({
          success: false,
          error: `Raspi recognize failed: HTTP ${raspiRes.status}`,
          detail: text?.slice(0, 300),
        });
      }

      // Raspi trả JSON
      if (ct.includes("application/json")) {
        const data = JSON.parse(text || "{}");
        return res.json(data);
      }

      // Raspi trả không phải JSON
      return res.status(502).json({
        success: false,
        error: "Raspi response is not JSON",
        detail: text?.slice(0, 300),
      });
    } catch (err) {
      const msg =
        err.name === "AbortError"
          ? "Raspi recognize timeout"
          : err.message || "Unknown error";
      return res.status(500).json({ success: false, error: msg });
    }
  }
}

export default new RaspiController();
