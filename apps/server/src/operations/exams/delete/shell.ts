import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  deleteExamCore,
  createExamDeleteAdapter,
  type DeleteExamPort,
} from "./core.js";

export function createExamDeleteShell(
  portFactory: () => DeleteExamPort = createExamDeleteAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await deleteExamCore(port, caller, { id: req.params.id });
    res.status(200).json(result);
  };
}
