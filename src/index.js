// server/src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import route from "./routes/index.js";
import connectDB from "./config/db/index.js";

dotenv.config();

const app = express();

const ALLOW_ORIGINS = [
  "https://f-lock-frontend.pages.dev",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOW_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
route(app);

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connect failed:", err.message);
    process.exit(1);
  });
