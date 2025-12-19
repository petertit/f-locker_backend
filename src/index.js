import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import route from "./routes/index.js";
import connectDB from "./config/db/index.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "https://f-lock-frontend.pages.dev",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//route init
route(app);

const PORT = process.env.PORT || 4000;
// mongDB
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("✅ Connected to MongoDB Atlas");
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
