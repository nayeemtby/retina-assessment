import { Router } from "express";
import {
  LeaderboardQuerySchema,
  LeaderboardParamsSchema,
} from "@project/contracts";
import { validateQuery, validateParams } from "../middleware/validate.js";
import { createLeaderboardGetShell } from "../operations/leaderboard/get/shell.js";

export const leaderboardRouter = Router();

// Public: GET /api/leaderboard/:examId
leaderboardRouter.get(
  "/:examId",
  validateParams(LeaderboardParamsSchema),
  validateQuery(LeaderboardQuerySchema),
  createLeaderboardGetShell()
);
