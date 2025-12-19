import authRouter from "./auth.js";
import lockerRouter from "./locker.js";
import raspiRouter from "./raspi.js";
import siteRouter from "./site.js";

export default function route(app) {
  app.use("/", authRouter);
  app.use("/", lockerRouter);
  app.use("/", raspiRouter);

  app.use("/", siteRouter);
}
