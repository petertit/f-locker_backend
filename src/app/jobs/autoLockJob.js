// src/app/jobs/autoLockJob.js
import Locker from "../models/Locker.js";
import History from "../models/History.js";
import raspiService from "../../services/raspi_service.js";


export function startAutoLockJob({
  timeoutMs = 60_000, 
  intervalMs = 10_000, 
} = {}) {
  console.log(
    `🕒 Auto-lock job started | timeout=${timeoutMs}ms | interval=${intervalMs}ms`
  );

  let running = false;

  setInterval(async () => {
    if (running) return;
    running = true;

    try {
      const now = Date.now();

     
      const candidates = await Locker.find({
        status: "OPEN",
        ownerId: { $ne: null },
      }).lean();

      if (!candidates.length) return;

      const expired = candidates.filter((l) => {
        const last =
          (l.lastActiveAt ? new Date(l.lastActiveAt).getTime() : null) ??
          (l.timestamp ? new Date(l.timestamp).getTime() : null) ??
          now;

        return now - last > timeoutMs;
      });

      if (!expired.length) return;

      console.log(
        `🔎 AUTOLOCK scan: candidates=${candidates.length} expired=${expired.length}`
      );

      for (const l of expired) {
        try {
        
          await raspiService.lock(l.lockerId, "AUTOLOCK");

         
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

      
          await new History({
            userId: l.ownerId,
            lockerId: l.lockerId,
            action: "LOCKED",
          }).save();

          console.log(`🔒 AUTOLOCK OK locker=${l.lockerId}`);
        } catch (e) {
        
          console.warn(
            `⚠️ AUTOLOCK FAIL locker=${l.lockerId}:`,
            e?.message || e
          );
        }
      }
    } catch (e) {
      console.error("❌ AUTOLOCK JOB ERROR:", e?.message || e);
    } finally {
      running = false;
    }
  }, intervalMs);
}
