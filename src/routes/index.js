// server/src/routes/index.js
import authRouter from "./auth.js";
import lockerRouter from "./locker.js";
import raspiRouter from "./raspi.js";
import siteRouter from "./site.js";

export default function route(app) {
  app.use("/", siteRouter);

  // API
  app.use("/", authRouter); // /register /login /update /user/:id /history/:userId
  app.use("/", lockerRouter); // /lockers/status /lockers/update
  app.use("/", raspiRouter); // /raspi/*
}
