import express, { type Application } from "express";
import cors from "cors";
import { wireError, FailureCodes } from "@project/contracts";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { studentRouter } from "./routes/students.js";
import { examRouter } from "./routes/exams.js";
import { resultRouter } from "./routes/results.js";
import { leaderboardRouter } from "./routes/leaderboard.js";

export function createApp(): Application {
  const app = express();

  // Core middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/students", studentRouter);
  app.use("/api/exams", examRouter);
  app.use("/api/results", resultRouter);
  app.use("/api/leaderboard", leaderboardRouter);

  // Catch-all 404 handler with WireResult
  app.use((_req, res) => {
    res.status(200).json(
      wireError({
        code: FailureCodes.NOT_FOUND,
        message: "Endpoint not found",
      })
    );
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
