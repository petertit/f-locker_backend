import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import route from "./routes/index.js";
import connectDB from "./config/db/index.js";

dotenv.config();

const app = express();

// ✅ CORS
const allowedOrigins = [
  "https://f-lock-frontend.pages.dev",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
];

function isAllowedOrigin(origin) {
  if (!origin) return true; // postman/curl/server-to-server

  try {
    const u = new URL(origin);

    // ✅ allow Cloudflare Pages preview + prod (bdxxxx.f-lock-frontend.pages.dev)
    if (u.hostname.endsWith(".pages.dev")) return true;

    // ✅ allow explicit list
    if (allowedOrigins.includes(origin)) return true;

    return false;
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ✅ BẮT BUỘC: xử lý preflight cho mọi route (fix lỗi OPTIONS)
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ✅ health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "F-LOCK backend is running ✅" });
});

// ✅ API routes
route(app);

// ✅ 404 handler
app.use((req, res) => {
  return res.status(404).json({ ok: false, message: "Not Found" });
});

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
