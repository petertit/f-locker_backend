// src/app/controllers/RaspiController.js
import raspiService from "../services/raspi_service.js";

class RaspiController {
  async status(req, res) {
    return res.json({ success: true, ok: true });
  }

  async lock(req, res) {
    try {
      const { lockerId } = req.body || {};
      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }

      const user = req.user?.email || null;
      const r = await raspiService.lock(lockerId, user);

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi lock failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }

      return res.json({ success: true, ...(r.data || { data: r.data }) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async unlock(req, res) {
    try {
      const { lockerId } = req.body || {};
      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }

      const user = req.user?.email || null;
      const r = await raspiService.unlock(lockerId, user);

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi unlock failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }

      return res.json({ success: true, ...(r.data || { data: r.data }) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST /raspi/recognize-remote
  async recognizeRemote(req, res) {
    try {
      const { imageBase64, lockerId } = req.body || {};
      if (!imageBase64) {
        return res
          .status(400)
          .json({ success: false, error: "Missing imageBase64" });
      }

      const user = req.user?.email || null;

      const r = await raspiService.recognizeRemote({
        imageBase64,
        lockerId: lockerId || null,
        user,
      });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi recognize failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }

      return res.json({
        success: true,
        ...(r.data && typeof r.data === "object"
          ? r.data
          : { data: r.data ?? null }),
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // ✅ POST /raspi/capture-remote-batch
  async captureRemoteBatch(req, res) {
    try {
      const { name, images_data } = req.body || {};
      if (!name)
        return res.status(400).json({ success: false, error: "Missing name" });

      if (!Array.isArray(images_data) || images_data.length !== 5) {
        return res.status(400).json({
          success: false,
          error: `images_data must be an array of 5 images. Got ${Array.isArray(images_data) ? images_data.length : 0}`,
        });
      }

      const r = await raspiService.captureRemoteBatch({ name, images_data });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi capture-remote-batch failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }

      return res.json({ success: true, ...(r.data || { data: r.data }) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // ✅ POST /raspi/capture-batch (Raspi tự chụp)
  async captureBatch(req, res) {
    try {
      const { name } = req.body || {};
      if (!name)
        return res.status(400).json({ success: false, error: "Missing name" });

      const r = await raspiService.captureBatch({ name });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi capture-batch failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }

      return res.json({ success: true, ...(r.data || { data: r.data }) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new RaspiController();
