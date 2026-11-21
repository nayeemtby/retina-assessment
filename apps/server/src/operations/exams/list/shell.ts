import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  listExamsCore,
  createExamListAdapter,
  type ListExamsPort,
} from "./core.js";

export function createExamListShell(
  portFactory: () => ListExamsPort = createExamListAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await listExamsCore(port, caller, req.query as any);
    res.status(200).json(result);
  };
}
