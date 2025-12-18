// server/src/app/controllers/RaspiController.js
import User from "../models/User.js";
import History from "../models/History.js";
import * as raspiService from "../services/raspi_service.js";

class RaspiController {
  async status(req, res) {
    try {
      const data = await raspiService.forwardGet("/status");
      return res.json({ ok: true, data });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  async capture(req, res) {
    try {
      const data = await raspiService.forwardPost("/capture", req.body);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async captureBatch(req, res) {
    try {
      const data = await raspiService.forwardPost("/capture-batch", req.body);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async captureRemoteBatch(req, res) {
    try {
      const data = await raspiService.forwardPost(
        "/capture-remote-batch",
        req.body
      );
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async recognize(req, res) {
    try {
      const data = await raspiService.forwardGet("/recognize");
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async recognizeRemote(req, res) {
    try {
      const data = await raspiService.forwardPost(
        "/recognize-remote",
        req.body
      );
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /raspi/unlock  (log OPENED)
  async unlock(req, res) {
    console.log("--- Received request at /raspi/unlock ---");
    console.log("Request body:", req.body);

    try {
      const { lockerId, user: userEmail } = req.body;

      let userIdToLog = null;
      if (userEmail) {
        const user = await User.findOne({
          email: userEmail.toLowerCase(),
        }).lean();
        if (user) userIdToLog = user._id;
        else
          console.error(
            `History log failed: User not found for email ${userEmail}`
          );
      } else {
        console.error("History log failed: User email not provided");
      }

      if (userIdToLog) {
        try {
          await new History({
            userId: userIdToLog,
            lockerId,
            action: "OPENED",
          }).save();
          console.log("✅ OPENED History event saved successfully!");
        } catch (saveError) {
          console.error("❌ Error saving OPENED history event:", saveError);
        }
      } else {
        console.error("❌ Skipping OPENED history log due to missing user ID.");
      }

      const data = await raspiService.forwardPost("/unlock", req.body);
      console.log("Response from Pi:", data);
      return res.json(data);
    } catch (err) {
      console.error("❌ Error in /raspi/unlock endpoint:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      console.log("--- Finished processing /raspi/unlock ---");
    }
  }

  async lock(req, res) {
    console.log("--- Received request at /raspi/lock ---");
    console.log("Request body:", req.body);

    try {
      const data = await raspiService.forwardPost("/lock", req.body);
      console.log("Response from Pi:", data);
      return res.json(data);
    } catch (err) {
      console.error("❌ Error in /raspi/lock endpoint:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      console.log("--- Finished processing /raspi/lock ---");
    }
  }
}

export default new RaspiController();
