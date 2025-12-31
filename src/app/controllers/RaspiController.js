import * as raspiService from "../../services/raspi_service.js";

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
      const { lockerId } = req.body;
      if (!lockerId) {
        return res.status(400).json({ error: "Missing lockerId" });
      }
      const data = await raspiService.forwardPost("/unlock", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  async lock(req, res) {
    try {
      const { lockerId } = req.body;
      if (!lockerId) {
        return res.status(400).json({ error: "Missing lockerId" });
      }
      const data = await raspiService.forwardPost("/lock", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  async capture(req, res) {
    try {
      const data = await raspiService.forwardPost("/capture", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  async record(req, res) {
    try {
      const data = await raspiService.forwardPost("/record", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }

  // ✅ FRONTEND → BACKEND → RASPI
  async recognizeRemote(req, res) {
    try {
      const data = await raspiService.forwardPost("/recognize", req.body);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message });
    }
  }
}

export default new RaspiController();
