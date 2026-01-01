// src/app/controllers/RaspiController.js
import raspiService from "../../services/raspi_service.js";

class RaspiController {
  async status(req, res) {
    try {
      const data = await raspiService.forwardGet("/status");
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  async unlock(req, res) {
    try {
      const data = await raspiService.forwardPost("/unlock", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  async lock(req, res) {
    try {
      const data = await raspiService.forwardPost("/lock", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  // ✅ Nhận diện trực tiếp từ Raspi (camera Raspi)
  async recognize(req, res) {
    try {
      const data = await raspiService.forwardPost("/recognize", req.body || {});
      return res.json({ success: true, ...data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  // ✅ Nhận diện từ ảnh base64 gửi lên (camera web/phone)
  async recognizeRemote(req, res) {
    try {
      const data = await raspiService.forwardPost(
        "/recognize-remote",
        req.body
      );
      return res.json({ success: true, ...data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  async capture(req, res) {
    try {
      const data = await raspiService.forwardPost("/capture", req.body);
      return res.json({ success: true, ...data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  async record(req, res) {
    try {
      const data = await raspiService.forwardPost("/record", req.body);
      return res.json({ success: true, ...data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }
}

export default new RaspiController();
