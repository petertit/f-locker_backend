import authRouter from "./auth.js";
import lockerRouter from "./locker.js";
import raspiRouter from "./raspi.js";
import siteRouter from "./site.js";
import passRouter from "./pass.js";
import adminRouter from "./admin.js";
export default function route(app) {
  app.use("/", siteRouter);

  app.use("/auth", authRouter);

  app.use("/", authRouter);

  app.use("/lockers", lockerRouter);
  app.use("/raspi", raspiRouter);
  app.use("/pass", passRouter);
  app.use("/admin", adminRouter);
}
