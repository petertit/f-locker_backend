// src/app/controllers/RaspiController.js
import raspiService from "../../services/raspi_service.js";

class RaspiController {
  async status(req, res) {
    try {
      const data = await raspiService.forwardGet("/status");
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(err.status || 502).json({
        success: false,
        error: err.message,
        detail: err.data || null,
      });
    }
  }

  async unlock(req, res) {
    try {
      const data = await raspiService.forwardPost("/unlock", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(err.status || 502).json({
        success: false,
        error: err.message,
        detail: err.data || null,
      });
    }
  }

  async lock(req, res) {
    try {
      const data = await raspiService.forwardPost("/lock", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(err.status || 502).json({
        success: false,
        error: err.message,
        detail: err.data || null,
      });
    }
  }

  // optional (nếu raspi bạn có endpoint /capture)
  async capture(req, res) {
    try {
      const data = await raspiService.forwardPost("/capture", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(err.status || 502).json({
        success: false,
        error: err.message,
        detail: err.data || null,
      });
    }
  }

  // ✅ FIX: endpoint nhận diện từ browser (base64)
  async recognizeRemote(req, res) {
    try {
      // body mong đợi: { imageBase64, lockerId, userId/email }
      const data = await raspiService.forwardPost(
        "/recognize-remote",
        req.body
      );
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(err.status || 502).json({
        success: false,
        error: err.message,
        detail: err.data || null,
      });
    }
  }
}

export default new RaspiController();
