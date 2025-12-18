// server/src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import methodOverride from "method-override";
import morgan from "morgan";

import db from "./config/db/index.js";
import route from "./routes/index.js";

import path from "path";
import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(morgan("dev"));

// Connect DB
await db.connect();

// Routes
route(app);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
