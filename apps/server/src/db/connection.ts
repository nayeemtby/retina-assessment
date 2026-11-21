import mongoose from "mongoose";
import { env } from "../config/env.js";

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    isConnected = true;
    console.log(`[database] Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("[database] Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("[database] Disconnected from MongoDB");
  } catch (error) {
    console.error("[database] Error disconnecting from MongoDB:", error);
    throw error;
  }
}

mongoose.connection.on("error", (err) => {
  console.error("[database] MongoDB runtime connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("[database] MongoDB disconnected");
});
