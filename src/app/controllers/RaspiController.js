import raspiService from "../../services/raspi_service.js";

function stripDataUrlToBase64(s) {
  if (!s || typeof s !== "string") return "";
  // if dataURL => remove prefix
  if (s.includes("base64,")) return s.split("base64,", 2)[1];
  // if already pure base64
  return s;
}

class RaspiController {
  async status(req, res) {
    try {
      const r = await raspiService.status();
      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi status failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }
      return res.json({ success: true, ...(r.data || {}) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async lock(req, res) {
    try {
      const { lockerId } = req.body || {};
      if (!lockerId)
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });

      const user = req.user?.email || null;
      const r = await raspiService.lock(lockerId, user);

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi lock failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }
      return res.json({ success: true, ...(r.data || {}) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async unlock(req, res) {
    try {
      const { lockerId } = req.body || {};
      if (!lockerId)
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });

      const user = req.user?.email || null;
      const r = await raspiService.unlock(lockerId, user);

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi unlock failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }
      return res.json({ success: true, ...(r.data || {}) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // ✅ POST /raspi/recognize-remote
  async recognizeRemote(req, res) {
    try {
      const { imageBase64, lockerId } = req.body || {};
      if (!imageBase64)
        return res
          .status(400)
          .json({ success: false, error: "Missing imageBase64" });

      const image_data = stripDataUrlToBase64(imageBase64);
      if (!image_data)
        return res
          .status(400)
          .json({ success: false, error: "Invalid imageBase64" });

      const user = req.user?.email || null;

      const r = await raspiService.recognizeRemote({
        image_data,
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

      // Raspi returns: {success: bool, name: "..."}
      return res.json({ success: true, ...(r.data || {}) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // ✅ POST /raspi/capture-remote-batch
  async captureRemoteBatch(req, res) {
    try {
      const { name, images_data, lockerId } = req.body || {};
      if (!name)
        return res.status(400).json({ success: false, error: "Missing name" });
      if (!Array.isArray(images_data) || images_data.length !== 5) {
        return res.status(400).json({
          success: false,
          error: "images_data must be an array of 5 base64 images",
        });
      }

      const user = req.user?.email || null;

      const r = await raspiService.captureRemoteBatch({
        name,
        images_data,
        lockerId: lockerId || null,
        user,
      });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi capture/train failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }

      return res.json({ success: true, ...(r.data || {}) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // optional raspi cam mode
  async captureBatch(req, res) {
    try {
      const { name, lockerId } = req.body || {};
      if (!name)
        return res.status(400).json({ success: false, error: "Missing name" });

      const user = req.user?.email || null;

      const r = await raspiService.captureBatch({
        name,
        lockerId: lockerId || null,
        user,
      });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi capture/train failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }

      return res.json({ success: true, ...(r.data || {}) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new RaspiController();
