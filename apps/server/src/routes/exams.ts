import { Router } from "express";
import {
  CreateExamSchema,
  UpdateExamSchema,
  ExamQuerySchema,
  LeaderboardQuerySchema,
  LeaderboardParamsSchema,
} from "@project/contracts";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validate.js";
import { createExamCreateShell } from "../operations/exams/create/shell.js";
import { createExamListShell } from "../operations/exams/list/shell.js";
import { createExamGetShell } from "../operations/exams/get/shell.js";
import { createExamUpdateShell } from "../operations/exams/update/shell.js";
import { createExamDeleteShell } from "../operations/exams/delete/shell.js";
import { createLeaderboardGetShell } from "../operations/leaderboard/get/shell.js";

export const examRouter = Router();

examRouter.get("/", validateQuery(ExamQuerySchema), createExamListShell());
examRouter.post("/", validateBody(CreateExamSchema), createExamCreateShell());

// Public: GET /api/exams/:examId/leaderboard (per PRD Section 7.1)
examRouter.get(
  "/:examId/leaderboard",
  validateParams(LeaderboardParamsSchema),
  validateQuery(LeaderboardQuerySchema),
  createLeaderboardGetShell()
);

examRouter.get("/:id", createExamGetShell());
examRouter.put("/:id", validateBody(UpdateExamSchema), createExamUpdateShell());
examRouter.delete("/:id", createExamDeleteShell());
