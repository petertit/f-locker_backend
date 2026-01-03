import raspiService from "../../services/raspi_service.js";

class RaspiController {
  async status(req, res) {
    return res.json({ success: true, ok: true });
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

      return res.json({ success: true, data: r.data || null });
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

      return res.json({ success: true, data: r.data || null });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async recognizeRemote(req, res) {
    try {
      const { imageBase64, lockerId } = req.body || {};
      if (!imageBase64) {
        return res
          .status(400)
          .json({ success: false, error: "Missing imageBase64" });
      }

      if (
        typeof imageBase64 !== "string" ||
        !imageBase64.startsWith("data:image/")
      ) {
        return res.status(400).json({
          success: false,
          error: "imageBase64 must be data:image/* base64 string",
        });
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

  // ✅ NEW: POST /raspi/capture-remote-batch
  async captureRemoteBatch(req, res) {
    try {
      const { count, lockerId } = req.body || {};
      const user = req.user?.email || null;

      // count mặc định 5 (đúng UI "0/5")
      const n = Number(count ?? 5);
      if (!Number.isFinite(n) || n <= 0 || n > 20) {
        return res.status(400).json({
          success: false,
          error: "Invalid count (1..20)",
        });
      }

      const r = await raspiService.captureRemoteBatch({
        count: n,
        lockerId: lockerId || null,
        user,
      });

      if (!r.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspi capture batch failed",
          detail: r.data || r.text || `HTTP ${r.status}`,
        });
      }

      return res.json({ success: true, data: r.data || null });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new RaspiController();
