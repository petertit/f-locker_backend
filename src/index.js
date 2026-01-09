// src/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import route from "./routes/index.js";
import connectDB from "./config/db/index.js";

import { startAutoLockJob } from "./app/jobs/autoLockJob.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "https://f-lock-frontend.pages.dev",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
];

function isAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  if (/^https:\/\/[a-z0-9-]+\.f-lock-frontend\.pages\.dev$/i.test(origin))
    return true;

  return false;
}

const corsOptions = {
  origin: function (origin, cb) {
    if (isAllowed(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ ok: true, message: "F-LOCK backend is running ✅" });
});

route(app);

app.use((req, res) => {
  return res.status(404).json({ ok: false, message: "Not Found" });
});

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();

    startAutoLockJob({
      timeoutMs: Number(process.env.AUTO_LOCK_TIMEOUT_MS) || 60_000,
      intervalMs: Number(process.env.AUTO_LOCK_INTERVAL_MS) || 10_000,
    });

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Cannot start server:", err.message);
    process.exit(1);
  }
})();
