// src/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import route from "./routes/index.js";
import connectDB from "./config/db/index.js"; // đảm bảo file này export default function

dotenv.config();

const app = express();

//CORS
const allowedOrigins = [
  "https://f-lock-frontend.pages.dev",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// health check
app.get("/.*/", (req, res) => {
  res.json({ ok: true, message: "F-LOCK backend is running ✅" });
});

// routes
route(app);

// start
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Cannot start server:", err.message);
    process.exit(1);
  }
})();
