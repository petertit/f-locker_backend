// src/app/controllers/RaspiController.js
import * as raspiService from "../../services/raspi_service.js";

class RaspiController {
  // GET /raspi/status
  async status(req, res) {
    try {
      const data = await raspiService.forwardGet("/status");
      return res.json({ ok: true, data });
    } catch (err) {
      return res.status(502).json({ ok: false, error: err.message });
    }
  }

  // POST /raspi/capture
  async capture(req, res) {
    try {
      const data = await raspiService.forwardPost("/capture", req.body);
      return res.json({ ok: true, data });
    } catch (err) {
      return res.status(502).json({ ok: false, error: err.message });
    }
  }

  // POST /raspi/recognize
  async recognize(req, res) {
    try {
      const data = await raspiService.forwardPost("/recognize", req.body);
      return res.json({ ok: true, data });
    } catch (err) {
      return res.status(502).json({ ok: false, error: err.message });
    }
  }

  // POST /raspi/record
  async record(req, res) {
    try {
      const data = await raspiService.forwardPost("/record", req.body);
      return res.json({ ok: true, data });
    } catch (err) {
      return res.status(502).json({ ok: false, error: err.message });
    }
  }

  // POST /raspi/unlock
  async unlock(req, res) {
    try {
      const { lockerId, user } = req.body || {};
      if (!lockerId) {
        return res.status(400).json({ ok: false, error: "Missing lockerId" });
      }

      const data = await raspiService.forwardPost("/unlock", {
        lockerId,
        user: user || null,
        ...req.body,
      });

      return res.json({ ok: true, data });
    } catch (err) {
      return res.status(502).json({ ok: false, error: err.message });
    }
  }

  // POST /raspi/lock
  async lock(req, res) {
    try {
      const { lockerId, user } = req.body || {};
      if (!lockerId) {
        return res.status(400).json({ ok: false, error: "Missing lockerId" });
      }

      const data = await raspiService.forwardPost("/lock", {
        lockerId,
        user: user || null,
        ...req.body,
      });

      return res.json({ ok: true, data });
    } catch (err) {
      return res.status(502).json({ ok: false, error: err.message });
    }
  }
}

export default new RaspiController();
