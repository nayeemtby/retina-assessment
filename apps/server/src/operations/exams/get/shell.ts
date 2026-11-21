import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  getExamCore,
  createExamGetAdapter,
  type GetExamPort,
} from "./core.js";

export function createExamGetShell(
  portFactory: () => GetExamPort = createExamGetAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await getExamCore(port, caller, { id: req.params.id });
    res.status(200).json(result);
  };
}
