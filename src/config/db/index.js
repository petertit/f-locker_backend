// src/config/db/index.js
import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI");

  const DB_NAME = process.env.DB_NAME || "boxdata";

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName: DB_NAME,
  });

  console.log(`✅ MongoDB connected. db=${DB_NAME}`);
}
