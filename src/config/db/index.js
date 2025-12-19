import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("❌ Missing MONGO_URI in environment variables");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("✅ Connected to MongoDB Atlas");
}
