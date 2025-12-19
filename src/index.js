import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db/index.js";
import route from "./routes/index.js";

dotenv.config();

const app = express();
const corsOptions = {
  origin: [
    "https://f-lock-frontend.pages.dev",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

//Middleware
app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Connect DB
await connectDB();

//Routes
route(app);

//Health check
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
