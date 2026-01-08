// src/app/jobs/autoLockJob.js
import Locker from "../models/Locker.js";
import History from "../models/History.js";
import raspiService from "../services/raspi_service.js";

export function startAutoLockJob({
  timeoutMs = 60_000,
  intervalMs = 10_000,
} = {}) {
  console.log(
    `🕒 Auto-lock job started | timeout=${timeoutMs}ms | interval=${intervalMs}ms`
  );

  setInterval(async () => {
    const now = Date.now();
    const deadline = new Date(now - timeoutMs);

    // chỉ auto-lock những tủ đang OPEN + có owner + lastActiveAt quá hạn
    const expired = await Locker.find({
      status: "OPEN",
      ownerId: { $ne: null },
      lastActiveAt: { $lte: deadline },
    }).lean();

    for (const l of expired) {
      try {
        // 1) gọi Raspi lock
        await raspiService.lock(l.lockerId, "AUTOLOCK"); // service hiện có :contentReference[oaicite:5]{index=5}

        // 2) update DB về LOCKED + refresh time
        await Locker.updateOne(
          { lockerId: l.lockerId },
          {
            $set: {
              status: "LOCKED",
              timestamp: new Date(),
              lastActiveAt: new Date(),
            },
          }
        );

        // 3) ghi history
        await new History({
          userId: l.ownerId,
          lockerId: l.lockerId,
          action: "LOCKED",
        }).save();

        console.log(`🔒 AUTOLOCK OK locker=${l.lockerId}`);
      } catch (e) {
        // Raspi fail => lần sau thử lại
        console.warn(`⚠️ AUTOLOCK FAIL locker=${l.lockerId}:`, e?.message || e);
      }
    }
  }, intervalMs);
}
