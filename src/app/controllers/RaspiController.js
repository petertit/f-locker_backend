import raspiService from "../services/raspi_service.js";

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

  // ✅ POST /raspi/recognize-remote
  async recognizeRemote(req, res) {
    try {
      const { imageBase64, lockerId } = req.body || {};
      if (!imageBase64) {
        return res
          .status(400)
          .json({ success: false, error: "Missing imageBase64" });
      }

      // basic validate
      if (
        typeof imageBase64 !== "string" ||
        !imageBase64.startsWith("data:image/")
      ) {
        return res
          .status(400)
          .json({
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

      // r.data là JSON raspi trả về (matched / success / name / ...)
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
}

export default new RaspiController();
