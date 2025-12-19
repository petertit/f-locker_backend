import authRouter from "./auth.js";
import lockerRouter from "./locker.js";
import raspiRouter from "./raspi.js";
import siteRouter from "./site.js";

export default function route(app) {
  app.use("/api/auth", authRouter);
  app.use("/api/lockers", lockerRouter);
  app.use("/api/raspi", raspiRouter);

  app.use("/", siteRouter);
}
