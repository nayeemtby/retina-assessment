import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  updateExamCore,
  createExamUpdateAdapter,
  type UpdateExamPort,
} from "./core.js";

export function createExamUpdateShell(
  portFactory: () => UpdateExamPort = createExamUpdateAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await updateExamCore(port, caller, {
      id: req.params.id,
      data: req.body,
    });
    res.status(200).json(result);
  };
}
