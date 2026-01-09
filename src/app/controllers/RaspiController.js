// src/app/controllers/RaspiController.js
import raspiService from "../../services/raspi_service.js";

function sendRaspiError(res, e, fallbackMsg) {
  const status = e?.status || 502;
  const payload = e?.payload;

  // log để debug Render
  if (payload) {
    console.error("[RASPI ERROR]", {
      status,
      url: payload.url,
      raspiStatus: payload.status,
      data: payload.data,
      text: payload.text,
    });
  } else {
    console.error("[RASPI ERROR]", e);
  }

  return res.status(status).json({
    success: false,
    error: fallbackMsg || e?.message || "Raspi request failed",
    detail: payload?.data || payload?.text || null,
  });
}

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

      // ✅ service đã throw nếu lỗi
      const r = await raspiService.lock(lockerId, user);

      return res.json({
        success: true,
        ...(r.data && typeof r.data === "object" ? r.data : { data: r.data }),
      });
    } catch (e) {
      return sendRaspiError(res, e, "Raspi lock failed");
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

      return res.json({
        success: true,
        ...(r.data && typeof r.data === "object" ? r.data : { data: r.data }),
      });
    } catch (e) {
      return sendRaspiError(res, e, "Raspi unlock failed");
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

      return res.json({
        success: true,
        ...(r.data && typeof r.data === "object"
          ? r.data
          : { data: r.data ?? null }),
      });
    } catch (e) {
      return sendRaspiError(res, e, "Raspi recognize failed");
    }
  }

  // POST /raspi/capture-remote-batch
  async captureRemoteBatch(req, res) {
    try {
      const { name, images_data, lockerId } = req.body || {};

      if (!name) {
        return res.status(400).json({ success: false, error: "Missing name" });
      }

      if (!Array.isArray(images_data) || images_data.length !== 5) {
        return res.status(400).json({
          success: false,
          error: `images_data must be an array of 5 images. Got ${
            Array.isArray(images_data) ? images_data.length : 0
          }`,
        });
      }

      const r = await raspiService.captureRemoteBatch({
        name,
        images_data,
        lockerId: lockerId || null,
      });

      return res.json({
        success: true,
        ...(r.data && typeof r.data === "object" ? r.data : { data: r.data }),
      });
    } catch (e) {
      return sendRaspiError(res, e, "Raspi capture-remote-batch failed");
    }
  }

  // POST /raspi/capture-batch (Raspi tự chụp)
  async captureBatch(req, res) {
    try {
      const { name, count, lockerId } = req.body || {};

      if (!name) {
        return res.status(400).json({ success: false, error: "Missing name" });
      }

      const r = await raspiService.captureBatch({
        name,
        count: Number(count) || 5,
        lockerId: lockerId || null,
      });

      return res.json({
        success: true,
        ...(r.data && typeof r.data === "object" ? r.data : { data: r.data }),
      });
    } catch (e) {
      return sendRaspiError(res, e, "Raspi capture-batch failed");
    }
  }
}

export default new RaspiController();
