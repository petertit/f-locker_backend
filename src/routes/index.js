import authRouter from "./auth.js";
import lockerRouter from "./locker.js";
import raspiRouter from "./raspi.js";
import siteRouter from "./site.js";
import passRouter from "./pass.js";

export default function route(app) {
  // pages
  app.use("/", siteRouter);

  // ✅ API: mount auth under /auth
  app.use("/auth", authRouter);

  // ✅ (optional) backward compatible: vẫn hỗ trợ /login /register /update cũ
  app.use("/", authRouter);

  app.use("/lockers", lockerRouter);
  app.use("/raspi", raspiRouter);
  app.use("/pass", passRouter);
}
