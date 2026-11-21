import { Router } from "express";
import {
  CreateResultSchema,
  UpdateResultSchema,
  ResultQuerySchema,
} from "@project/contracts";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { createResultCreateShell } from "../operations/results/create/shell.js";
import { createResultListShell } from "../operations/results/list/shell.js";
import { createResultGetShell } from "../operations/results/get/shell.js";
import { createResultUpdateShell } from "../operations/results/update/shell.js";
import { createResultDeleteShell } from "../operations/results/delete/shell.js";

export const resultRouter = Router();

resultRouter.get("/", validateQuery(ResultQuerySchema), createResultListShell());
resultRouter.post("/", validateBody(CreateResultSchema), createResultCreateShell());
resultRouter.get("/:id", createResultGetShell());
resultRouter.put("/:id", validateBody(UpdateResultSchema), createResultUpdateShell());
resultRouter.delete("/:id", createResultDeleteShell());
