// src/app/controllers/RaspiController.js

import raspiService from "../../services/raspi_service.js";

class RaspiController {
  // GET /raspi/status
  async status(req, res) {
    return res.json({ success: true, ok: true });
  }

  // POST /raspi/lock
  async lock(req, res) {
    try {
      const { lockerId } = req.body || {};

      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }

      const user = req.user?.email || null;

      const result = await raspiService.lock(lockerId, user);

      if (!result.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspberry Pi lock failed",
          detail: result.data || result.text || `HTTP ${result.status}`,
        });
      }

      return res.json({
        success: true,
        data: result.data || null,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  // POST /raspi/unlock
  async unlock(req, res) {
    try {
      const { lockerId } = req.body || {};

      if (!lockerId) {
        return res
          .status(400)
          .json({ success: false, error: "Missing lockerId" });
      }

      const user = req.user?.email || null;

      const result = await raspiService.unlock(lockerId, user);

      if (!result.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspberry Pi unlock failed",
          detail: result.data || result.text || `HTTP ${result.status}`,
        });
      }

      return res.json({
        success: true,
        data: result.data || null,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  // POST /raspi/recognize-remote
  async recognizeRemote(req, res) {
    try {
      const { imageBase64, lockerId } = req.body || {};

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: "Missing imageBase64",
        });
      }

      if (
        typeof imageBase64 !== "string" ||
        !imageBase64.startsWith("data:image/")
      ) {
        return res.status(400).json({
          success: false,
          error: "imageBase64 must be a valid data:image/* base64 string",
        });
      }

      const user = req.user?.email || null;

      const result = await raspiService.recognizeRemote({
        imageBase64,
        lockerId: lockerId || null,
        user,
      });

      if (!result.ok) {
        return res.status(502).json({
          success: false,
          error: "Raspberry Pi recognize failed",
          detail: result.data || result.text || `HTTP ${result.status}`,
        });
      }

      // Raspi có thể trả { success, matched, name, lockerId, ... }
      return res.json({
        success: true,
        ...(typeof result.data === "object" && result.data !== null
          ? result.data
          : { data: result.data || null }),
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
}

export default new RaspiController();
