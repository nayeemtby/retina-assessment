import { Router } from "express";
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  StudentQuerySchema,
} from "@project/contracts";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { createStudentCreateShell } from "../operations/students/create/shell.js";
import { createStudentListShell } from "../operations/students/list/shell.js";
import { createStudentGetShell } from "../operations/students/get/shell.js";
import { createStudentUpdateShell } from "../operations/students/update/shell.js";
import { createStudentDeleteShell } from "../operations/students/delete/shell.js";

export const studentRouter = Router();

studentRouter.get("/", validateQuery(StudentQuerySchema), createStudentListShell());
studentRouter.post("/", validateBody(CreateStudentSchema), createStudentCreateShell());
studentRouter.get("/:id", createStudentGetShell());
studentRouter.put("/:id", validateBody(UpdateStudentSchema), createStudentUpdateShell());
studentRouter.delete("/:id", createStudentDeleteShell());
