// src/app/jobs/autoLockJob.js
import Locker from "../models/Locker.js";
import History from "../models/History.js";
import raspiService from "../../services/raspi_service.js";

/**
 * Auto-lock lockers when inactive for a timeout.
 *
 * Logic:
 * - Only consider lockers that are OPEN and have ownerId
 * - Determine lastActive = lastActiveAt || timestamp || Date.now()
 * - If now - lastActive > timeoutMs => lock
 *
 * Why fallback?
 * - Existing Mongo documents may not have lastActiveAt.
 */
export function startAutoLockJob({
  timeoutMs = 60_000, // 60s
  intervalMs = 10_000, // 10s
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

      // ✅ Only lockers that are OPEN and have ownerId
      // (If you want ultra-safe: change OPEN -> {$in:["OPEN","LOCKED"]})
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
          // 1) Raspi lock
          await raspiService.lock(l.lockerId, "AUTOLOCK");

          // 2) Update DB -> LOCKED + refresh times
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

          // 3) History
          await new History({
            userId: l.ownerId,
            lockerId: l.lockerId,
            action: "LOCKED",
          }).save();

          console.log(`🔒 AUTOLOCK OK locker=${l.lockerId}`);
        } catch (e) {
          // If Raspi fails, keep OPEN so job retries next round
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
