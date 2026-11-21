import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  createExamCore,
  createExamCreateAdapter,
  type CreateExamPort,
} from "./core.js";

export function createExamCreateShell(
  portFactory: () => CreateExamPort = createExamCreateAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await createExamCore(port, caller, req.body);
    res.status(200).json(result);
  };
}
